const eventSource = new EventSource("/api/goldprice")

const liveContainer = document.getElementById('price-display')
const investmentForm = document.querySelector('form')
const dialog = document.querySelector('dialog')
const statusEl = document.getElementById('connection-status')

// Attach event listener to the dialog box to close when it's clicked 
dialog.querySelector('button').addEventListener('click',() => dialog.close())

let currentGoldPrice = null
let goldPriceToken = null 

// Handle live price updates

eventSource.onopen = () => {
    statusEl.textContent = 'Live Price 🟢'
}


eventSource.addEventListener('price-change', (event) => {
    const data = JSON.parse(event.data)
    const price = data.price
    goldPriceToken = {
        p: data.p,
        t: data.t,
        sig: data.sig
    }
    currentGoldPrice = parseFloat(price)
    liveContainer.textContent = price
})

// Handle connection loss

eventSource.onerror = () => {
    statusEl.textContent = 'Disconnected 🔴'
    console.log("Connection lost. Attempting to connect...")
}

investmentForm.addEventListener('submit', (e) => {
    e.preventDefault()
    new FormData(investmentForm)
})

investmentForm.addEventListener('formdata', (e) => {
    const data = e.formData
    const raw = e.formData.get('investment-amount')
    const amount = parseFloat(raw)
    
    if (!isNaN(amount) && !isNaN(currentGoldPrice)) {
        console.log(`User wants to invest ${amount}`)
        console.log(`Current gold price $${currentGoldPrice}`)
        try {
            fetch('/api/invest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }, 
                body: JSON.stringify({
                    investment: amount,
                    goldPrice: currentGoldPrice,
                    p: goldPriceToken.p,
                    t: goldPriceToken.t,
                    sig: goldPriceToken.sig
                })
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`)
                }
                return res.json()
            })
            .then(data => {
                console.log('Investment recorded:', data)

                const row = document.getElementById('receipt-row')
                const viewA = document.getElementById('receipt-link')
                const dlA = document.getElementById('receipt-download')

                const url = `api/receipt/${encodeURIComponent(data.receiptId)}`

                viewA.href = url
                dlA.href = url
                dlA.download = `receipt-${data.receiptId}.pdf`

                row.style.display = ''
                
                const summary = document.getElementById('investment-summary')
                const ounces = (amount / currentGoldPrice).toFixed(3)
        
                summary.textContent = `You just purchased ${ounces} ounces of gold for $${amount.toFixed(2)}. Please download a copy of your receipt below.`
                
                document.querySelector('dialog').showModal()

            })
            .catch(err => {
                console.error('Error submitting investment:', err)
            })
        } catch (err) {

        }

    }

    data.append('gold-price', currentGoldPrice)

})