// utils/replayCache.js
// Single-use cache for HMAC'd price tokens

import { TTL_MS } from './token.js'

// In-memory, process-local cache: sig -> tokenTimestampMs 

const used = new Map();

export function isUsed(sig) {
    return used.has(sig);
}

/**
 * 
 * @param {string} sig - the token signature
 * @param {number} tMs - timestamp to store 
 * 
 * 
 */

export function markUsed (sig, tMs) {
    if (typeof sig !== 'string' || sig.length < 10) return;
    if (!Number.isInteger(tMs) || tMs <= 0) return;
    used.set(sig, tMs)
}

export function prune(nowMs = Date.now())  {
    for (const [sig, tMs] of used.entries()) {
        if (nowMs - tMs > TTL_MS) {
            used.delete(sig)
        }
    }
}

export function startAutoPrune(intervalMs = Math.max(5000, Math.floor(TTL_MS / 2))) {
    const id = setInterval(prune, intervalMs)
    return () => clearInterval(id)
}

// for tests/debugging 

export function size() {
    return used.size;
}

export function clearAll() {
    used.clear();
}

