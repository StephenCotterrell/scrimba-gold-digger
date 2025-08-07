const eventSource = new EventSource("/api/goldprice")

const liveContainer = document.getElementById('price-display')
const investmentForm = document.querySelector('form')
const dialog = document.querySelector('dialog')
const statusEl = document.getElementById('connection-status')

let currentGoldPrice = null

// Handle live price updates

eventSource.onopen = () => {
    statusEl.textContent = 'Live Price 🟢'
}


eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    const price = data.price 
    currentGoldPrice = parseFloat(price)
    liveContainer.textContent = price
}

// Handle connection loss

eventSource.onerror = () => {
    statusEl.textContent = 'Disconnected 🔴'
    console.log("Connetion lost. Attempting to connect...")
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

        const summary = document.getElementById('investment-summary')
        const ounces = (amount / currentGoldPrice).toFixed(3)

        summary.textContent = `You just purchased ${ounces} ounces of gold for $${amount.toFixed(2)}. You will receieve documentation shortly.`

        dialog.showModal()
        dialog.querySelector('button').addEventListener('click',() => dialog.close())
    }

    data.append('gold-price', currentGoldPrice)

})