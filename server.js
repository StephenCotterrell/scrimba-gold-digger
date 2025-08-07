import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs/promises'
import { getContentType } from './utils/getContentType.js'
import { sendResponse } from './utils/sendResponse.js'
import { serveStatic } from './utils/serveStatic.js'

const PORT = 8000

const __dirname = import.meta.dirname

const server = http.createServer( async (req, res) => {

    return await serveStatic(req, res, __dirname)
    
})

server.listen(PORT, () => {
    console.log(`Connected on port: ${PORT}`)
})