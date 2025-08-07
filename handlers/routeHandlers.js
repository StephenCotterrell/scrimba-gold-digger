

export async function getGoldPrice(req, res) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let currentGoldPrice = 3432.20

    setInterval(() => {
        let randomPriceFluctuation = Math.floor(((Math.random() - 0.5) * 2000))/100
        currentGoldPrice += randomPriceFluctuation

        res.write(`data: ${
            JSON.stringify({
                event: 'price-change',
                price: currentGoldPrice.toFixed(2)
            })
        }\n\n`)
    }, 3000)
}

export function handleOnlyGetAllowed(res) {
    res.setHeader('Allowed', 'GET'),
    sendResponse(res, 405, 'application/json', JSON.stringify({ error: 'Method Not Allowed'}))
}

