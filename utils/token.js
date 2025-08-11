// utils/token.js
import crypto from 'node:crypto'

// Hardcoded for demo/portfolio; use environment variable in prod
const SECRET = process.env.PRICE_TOKEN_SECRET || 'demo-secret-key-change-me'

// Expose TTL from one place 
export const TTL_MS = 10000; // 10s

// ---={  helpers  }=---

function hmacPrice(pCents, t) {
    const payload = `${pCents}.${t}`
    return crypto.createHmac('sha256', SECRET).update(payload).digest('hex')  // Could also use 'base64url'
}

export function makePriceToken( pCents, nowMs = Date.now()) {

    if (!Number.isInteger(pCents) || pCents < 0) {
        throw new Error('pCents must be a non-negative interger.')
    }
    const t = nowMs
    const sig = hmacPrice(pCents, t)
    return { p: pCents, t, sig }
}

export function verifyPriceToken({ p, t, sig}, nowMs = Date.now()) {

    if (!Number.isInteger(p) || p < 0) {
        return { ok: false, reason: 'bad-price'}
    } 

    if (!Number.isInteger(t) || t <= 0) {
        return { ok: false, reason: 'bad-timestamp'}
    }

    if (typeof sig !== 'string' || sig.length < 10) {
        return { ok: false, reason: 'bad-signature'}
    }

    const expected = hmacPrice(p, t)

    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { ok: false, reason: 'signature-mismatch'}
    }

    if (nowMs - t > TTL_MS) {
        return { ok: false, reason: 'expired' }
    }

    return { ok: true }
    
}