import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getContentType } from './utils/getContentType.js'
import { sendResponse } from './utils/sendResponse.js'

const PORT = 8000

const __dirname = import.meta.dirname

const server = http.createServer( async (req, res) => {

    const publicDir = path.join(__dirname, 'public')
    const filePath = path.join(
        publicDir, 
        req.url === '/' ? 'index.html' : req.url
    )

    const ext = path.extname(filePath)
    const contentType = getContentType(ext)

    try {
        const content = await fs.readFile(filePath)
        sendResponse(res, 200, contentType, content)
    } catch (err) { 
        if (err.code === 'ENOENT') {
            const content = await fs.readFile(path.join(publicDir, '404.html'))
            sendResponse(res, 404, 'text/html', content)
        } else {
            sendResponse(res, 500, 'text/html', `<html><h1>Server Error: ${err} </h1></html>`)
        }
    }
})

server.listen(PORT, () => {
    console.log(`Connected on port: ${PORT}`)
})