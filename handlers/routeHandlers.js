import { sendResponse } from "../utils/sendResponse.js"
import fs from 'node:fs'
import path from 'node:path'
import { makePriceToken } from "../utils/token.js"
import { verifyPriceToken } from "../utils/token.js"
import { isUsed, markUsed } from "../utils/replayCache.js"


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
            

            const timestamp = new Date().toISOString()
            const logEntry = `${timestamp} | Investment: $${investment} | Gold Price: $${goldPrice} / ounce | Amount: ${ (investment / goldPrice).toFixed(4)} ounces \n\n`
            const logPath = path.join(process.cwd(), 'data', 'transactions.txt')

            fs.appendFile(logPath, logEntry, err => {
                if (err) {
                    console.error('Error writing log:', err)
                }
            })

            sendResponse(res, 200, 'application/json', JSON.stringify({
                status: 'success',
                investment, 
                goldPrice,
                timestamp: Date.now()
            }))
        } catch (err) {
            sendResponse(res, 500, 'application/json', JSON.stringify({
                error: 'Server Error'
            }))
        }
    })
    
}

