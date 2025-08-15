import path from 'node:path'
import fs from 'node:fs/promises'
import { getContentType } from './getContentType.js'
import { sendResponse } from './sendResponse.js'
import { handleForbidden } from '../handlers/routeHandlers.js'


export async function serveStatic(req, res, baseDir) {

    const { pathname } = new URL(req.url, 'http://x') 
    const decoded = decodeURIComponent(pathname)
    const normalized = path.normalize(decoded)

    const root = path.resolve(baseDir, 'public')
    const resolved = path.resolve(root, '.' + normalized)

    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
        return handleForbidden()
    }

    const filePath = (normalized === '/') ? path.join(root, 'index.html') : resolved
    
    const ext = path.extname(filePath)
    const contentType = getContentType(ext)

    try {
        const content = await fs.readFile(filePath)
        sendResponse(res, 200, contentType, content)
    } catch (error) {
        if (error.code === 'ENOENT') {
            const content = await fs.readFile(path.join(root, '404.html'))
            sendResponse(res, 404, 'text/html', content)
        } else {
            sendResponse(res, 500, 'text/html', `<html><h1>Server Error: ${error.code}<h1/><html/>`)
        }
    }

    
}