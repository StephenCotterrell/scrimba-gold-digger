import { sendResponse } from "../utils/sendResponse.js"
import fs from 'node:fs'
import path from 'node:path'

export async function getGoldPrice(req, res) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Transfer-Encoding', 'chunked')

    let currentGoldPrice = 3432.20

    const sendPrice = () => {
        const randomPriceFluctuation = Math.floor(((Math.random() - 0.5) * 2000))/100
        currentGoldPrice += randomPriceFluctuation
        
        res.write(`data: ${
            JSON.stringify({
                event: 'price-change',
                price: currentGoldPrice.toFixed(2)
            })
        }\n\n`)
    }

    sendPrice()

    const intervalId = setInterval(sendPrice, 3000)

    req.on('close', () => {
        console.log('Client disconnected, cleaning up...') 
        clearInterval(intervalId)
    })
}

export function handleMethodNotAllowed(res, allowedMethods) {
    res.setHeader('Allowed', allowedMethods),
    sendResponse(res, 405, 'application/json', JSON.stringify({ error: 'Method Not Allowed'}))
}

export async function postInvestment(req, res) {
    
    let body = ''

    req.on('data', chunk => {
        body += chunk
    })

    req.on('end', () => {
        try {
            const { investment, goldPrice } = JSON.parse(body)

            // validate input 

            if (typeof investment !== 'number' || typeof goldPrice !== 'number') {
                sendResponse(res, 400, 'application/json', JSON.stringify({ error: 'Invalid Input...'}))
            }

            // TODO: Some kind of logging of this transaction, to an actual file

            const timestamp = new Date().toISOString()

            const logEntry = `${timestamp} | Investment: $${investment} | Gold Price: $${goldPrice} / ounce | Amount: ${ (investment / goldPrice).toFixed(4)} ounces`

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

