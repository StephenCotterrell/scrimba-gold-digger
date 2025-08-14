import fs from 'node:fs/promises'
import path from 'node:path'

const jsonlPath = path.join(process.cwd(), 'data', 'transactions.ndjson')

export async function getTransactionById(id) {
    try {
        const text = await fs.readFile(jsonlPath, 'utf8')
        // scan lines from end for a tiny speedup

        const lines = text.trimEnd().split('\n')
        for (let i = lines.length - 1; i >= 0; i--) {
            const rec = JSON.parse(lines[i])
            if (rec.id === id) return rec;
        }
        return null;
    } catch (e) {
        if (e.code === 'ENOENT') return null;
        throw e;
    }
}