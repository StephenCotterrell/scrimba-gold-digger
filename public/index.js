const eventSource = new EventSource("/api/goldprice")

const liveContainer = document.getElementById('price-display')

// Handle live price updates

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    const price = data.price 
    liveContainer.textContent = price
}

// Handle connection loss

eventSource.onerror = () => {
    console.log("Connetion lost. Attempting to connect...")
}