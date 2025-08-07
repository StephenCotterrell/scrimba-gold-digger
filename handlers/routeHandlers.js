

export async function getGoldPrice(req, res) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Transfer-Encoding', 'chunked')

    let currentGoldPrice = 3432.20

    const sendPrice = () => {
        const randomPriceFluctuation = Math.floor(((Math.random() - 0.5) * 2000))/100
        currentGoldPrice += randomPriceFluctuation
        
        res.write(`data: ${
            JSON.stringify({
                event: 'price-change',
                price: currentGoldPrice.toFixed(2)
            })
        }\n\n`)
    }

    sendPrice()

    const intervalId = setInterval(sendPrice, 3000)

    req.on('close', () => {
        console.log('Client disconnected, cleaning up...') 
        clearInterval(intervalId)
    })
}

export function handleOnlyGetAllowed(res) {
    res.setHeader('Allowed', 'GET'),
    sendResponse(res, 405, 'application/json', JSON.stringify({ error: 'Method Not Allowed'}))
}

