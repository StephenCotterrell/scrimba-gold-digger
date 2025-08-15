import { sendResponse } from "../utils/sendResponse.js"
import fs from 'node:fs'
import path from 'node:path'
import { makePriceToken } from "../utils/token.js"
import { verifyPriceToken } from "../utils/token.js"
import { isUsed, markUsed } from "../utils/replayCache.js"
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid'
import { getTransactionById } from "../utils/transactions.js"


export async function getGoldPrice(req, res) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Transfer-Encoding', 'chunked')

    let currentGoldPrice = 3432.20

    const sendPrice = () => {
        const randomPriceFluctuation = Math.floor(((Math.random() - 0.5) * 2000))/100
        currentGoldPrice += randomPriceFluctuation
        
        const pCents = Math.round(currentGoldPrice * 100)
        const token = makePriceToken(pCents)

        res.write(
                `event: price-change\n` +
                `data: ${JSON.stringify({
                    price: currentGoldPrice.toFixed(2),
                    p: token.p, 
                    t: token.t, 
                    sig: token.sig,
                })}\n\n`
        )
    }

    sendPrice()

    const intervalId = setInterval(sendPrice, 3000)

    req.on('close', () => {
        console.log('Client disconnected, cleaning up...') 
        clearInterval(intervalId)
    })
}

export function handleMethodNotAllowed(res, allowedMethods) {
    res.setHeader('Allow', allowedMethods),
    sendResponse(res, 405, 'application/json', JSON.stringify({ error: 'Method Not Allowed'}))
}

export function handleApiNotFound(req, res) {
    const { pathname } = new URL(req.url, 'http://x')
    sendResponse(res, 404, 'application/json', JSON.stringify({
        status: 404,
        error: 'Not Found',
        message: `No API route found for ${pathname}`,
        path: pathname,
        method: req.method,
        timestamp: new Date().toISOString()
    }))
}

export async function postInvestment(req, res) {
    
    let body = ''

    req.on('data', chunk => {
        body += chunk
    })

    req.on('end', () => {
        try {
            const { investment, goldPrice, p, t, sig} = JSON.parse(body)
            
            if (typeof investment !== 'number' || typeof goldPrice !== 'number') {
                return sendResponse(res, 400, 'application/json', JSON.stringify({ error: 'Invalid Input...'}))
            }

            const v = verifyPriceToken({ p, t, sig})
            if (!v.ok) {
                console.warn('verifyPriceToken failed:', v.reason)
                return sendResponse(res, 422, 'application/json', JSON.stringify({ error: 'Unprocessable entity...'}))
            }

            if (Math.round(goldPrice * 100) !== p) {
                return sendResponse(res, 422, 'application/json', JSON.stringify({ error: 'Price mismatch...'}))
            }

            if (isUsed(sig)) {
                return sendResponse(res, 409, 'application/json', JSON.stringify({ error: "Token already used..."}))
            }

            markUsed(sig, t)
            
            const recieptId = uuidv4();
            const timestamp = new Date().toISOString()
            const ounces = investment / goldPrice

            // human readable log 
            const logEntry = `${timestamp} | ID: ${recieptId} | Investment: $${investment} | Gold Price: $${goldPrice} / ounce | Amount: ${ (investment / goldPrice).toFixed(4)} ounces \n\n`
            const logPath = path.join(process.cwd(), 'data', 'transactions.txt')

            fs.appendFile(logPath, logEntry, err => {
                if (err) {
                    console.error('Error writing log:', err)
                }
            })

            // machine readable log

            const jsonlPath = path.join(process.cwd(), 'data', 'transactions.ndjson')
            const record = { id: recieptId, ts: timestamp, investment, goldPrice, ounces: Number(ounces.toFixed(4)) }
            fs.appendFile(jsonlPath, JSON.stringify(record) + '\n', err => {
                if (err) console.error('Error writing jsonl', + err)
            })


            sendResponse(res, 200, 'application/json', JSON.stringify({
                status: 'success',
                investment, 
                goldPrice,
                timestamp: Date.now(),
                receiptId: recieptId
            }))
        } catch (err) {
            sendResponse(res, 500, 'application/json', JSON.stringify({
                error: 'Server Error'
            }))
        }
    })
    
}

export async function handleReceiptPdf(req, res, id) {

    const tx = await getTransactionById(id)

    if (!tx) {
        return sendResponse(res, 404, 'application/json', JSON.stringify({
            error: 'Receipt not found', id
        }))
    }

    const now = new Date();

    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${id}.pdf"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    })

    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    doc.on('error', (err) => { try { res.destroy(err) } catch {} })
    // doc.on('close', () => { try { doc.end() } catch {} })

    doc.pipe(res)

    doc.info = {
        Title: `Receipt ${id}`,
        Author: `Gold Digger`,
        Subject: 'Purchase Receipt',
        CreationDate: now
    }
    
    // Header 
    doc.font('Helvetica').fontSize(18).text('Receipt')
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(12)
    doc.text(`Receipt ID: ${tx.id}`)
    doc.text(`Date: ${tx.ts}`)
    doc.moveDown()

    // Summary Block

    const usd = (n) => `$${Number(n).toFixed(2)}`

    doc.font('Helvetica-Bold').text('Summary')
    doc.font('Helvetica')
    doc.text(`Investment: ${usd(tx.investment)}`)
    doc.text(`Gold Price: ${usd(tx.goldPrice)} per ounce`)
    doc.text(`Amount Purchased: ${tx.ounces.toFixed(4)} ounces`)
    doc.moveDown()

    // Footer()

    const drawFooter = (d) => {
        const { width, height } = d.page;
        d.font('Helvetica').fontSize(9)
        .text(`Gold Digger | Receipt ${tx.id} | Generated ${now.toLocaleString()}`, 50, height - 70, { width: width - 100, align: 'center'})
    }

    drawFooter(doc)
    doc.on('pageAdded', () => drawFooter(doc))

    doc.end()

}

export function handleForbidden(req, res) {
    sendResponse(res, 403, 'application/json', JSON.stringify({
        error: 'Forbidden'
    }))
}

