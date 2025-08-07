import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs/promises'

const PORT = 8000

const __dirname = import.meta.dirname

const server = http.createServer( async (req, res) => {

    const publicDir = path.join(__dirname, 'public')
    const filePath = path.join(
        publicDir, 
        req.url === '/' ? 'index.html' : req.url
    )

    const ext = path.extname(filePath)

    const types = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "text/json",
        ".png": "image/png"
    }

    const contentType = types[ext.toLowerCase()] || 'text/html'

    try {
        const content = await fs.readFile(filePath)
        res.statusCode = 200
        res.setHeader('Content-Type', contentType)
        res.end(content)
    } catch (err) {
        if (err.code === 'ENOENT') {
            const content = await fs.readFile(path.join(publicDir, '404.html'))
            res.statusCode = 404
            res.setHeader('Content-Type','text/html')
            res.end(content)
        } else {
            res.statusCode = 500
            res.setHeader('Content-Type', 'text/html')
            res.end(`<html><h1>Server Error: ${err} </h1></html>`)
        }
    }

    
    
})

server.listen(PORT, () => {
    console.log(`Connected on port: ${PORT}`)
})