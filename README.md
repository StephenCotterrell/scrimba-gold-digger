# Scrimba Gold Digger

This is a Scrimba backend project focusing on Node.js

Additional flair:

I have added validation in postTransaction that the price being used was one actually sent by the server. 

# Security & Data Integrity 

## HMAC-signed, single-use price tokens

### How it works

#### 1. Price Token Generation
- Each live price update sent over the SSE stream includes:
    - `p` - price in integer cents
    - `t` - issuance timestamp
    - `sig` - HMAC-SHA256 signature of `p` and `t` using server-only secret
- This binds the token to the exact price and issuance time

#### 2. Client Usage
- When submitting a purchase, the client sends back `{ investment, goldPrice, p, t, sig }` from the latest SSE update.

#### 3. Server Validation
- **Integrity Check**: Recomputes the HMAC using the server secret and compares to sig in constant time. 
- **Freshness Check**: Rejects tokens older than the configured TTL (10s in this demo)
- **Replay Prevention**: An in-memory cache tracks used signatures; any repeated use in the TTL window is rejected. 
- **Price match check**: Validates that the `goldPrice` matches the signed `p` value exactly.

#### 4. Logging 
- Successful transactions are appended to a local file log with timestamp, investment, price and purchased ounces. 

### Why this matters

- Prevents clients from fabricating prices or using stale data
- Demonstrates understanding of: 
    - SSE (Server-Sent Events) for live updates
    - Cryptographic HMAC for message integrity
    - Replay-attack prevention strategies
    - Secure, minimal server-side validation

