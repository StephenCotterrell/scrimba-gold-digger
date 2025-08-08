import http from 'node:http'
import { serveStatic } from './utils/serveStatic.js'
import { getGoldPrice, handleMethodNotAllowed, postInvestment } from './handlers/routeHandlers.js'

const PORT = 8000

const __dirname = import.meta.dirname

const server = http.createServer( async (req, res) => {

    if (req.url === '/api/goldprice') {
        if (req.method === 'GET') {
            return await getGoldPrice(req, res)
        } else {
            return handleMethodNotAllowed(res, 'GET')
        }
    } else if (req.url.startsWith('/api/invest')) {
        if (req.method === 'POST') {
            return await postInvestment(req, res)
        } else {
            return handleMethodNotAllowed(res, 'POST')
        }
    } else {
        return await serveStatic(req, res, __dirname)
    }
})


server.listen(PORT, () => console.log(`Connected on port: ${PORT}`))
