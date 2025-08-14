import http from 'node:http'
import { serveStatic } from './utils/serveStatic.js'
import { getGoldPrice, handleApiNotFound, handleMethodNotAllowed, postInvestment, handleReceiptPdf } from './handlers/routeHandlers.js'
import { startAutoPrune } from './utils/replayCache.js'
import { URL } from 'node:url';
import path from 'node:path'

startAutoPrune();

const PORT = 8000
const __dirname = import.meta.dirname

const receiptRoute = /^\/api\/receipt\/([^/]+)\/?$/;

const server = http.createServer( async (req, res) => {

    const { pathname } = new URL(req.url, 'http://x') 
    
    // API Branch 
    if (pathname.startsWith('/api/')) {
        
        const m = receiptRoute.exec(pathname)
        if (m) {
            if (req.method !== 'GET') return handleMethodNotAllowed(res, ['GET'])
            const id = decodeURIComponent(m[1])
            // TODO: Handle the case where there's a route after the receipt
            return handleReceiptPdf(req, res, id)
        } 
          
        if (pathname === '/api/goldprice') {
            if (req.method !== 'GET') return handleMethodNotAllowed(res, ['GET'])
            return await getGoldPrice(req, res)
        } 

        if (pathname === '/api/invest') {
            if (req.method !== 'POST') return handleMethodNotAllowed(res, ['POST'])
            return await postInvestment(req, res)
        }

        return handleApiNotFound(req, res)

    } 
    
    return await serveStatic(req, res, __dirname)

})


server.listen(PORT, () => console.log(`Connected on port: ${PORT}`))
