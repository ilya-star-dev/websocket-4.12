let socket = null
const buyButtons = document.querySelectorAll(".buy-btn")
const statusElement = document.getElementById("status")
const connectBtn = document.getElementById("connectBtn")
const disconnectBtn = document.getElementById("disconnectBtn")

function updateConnectionStatus(status, message) {
    statusElement.className = `connection-status ${status}`
    statusElement.textContent = message
}

function updateButtonStates(isConnected) {
    connectBtn.disabled = isConnected
    disconnectBtn.disabled = !isConnected
    
    buyButtons.forEach(button => {
        if (!isConnected) {
            button.disabled = true
        }
    })
}

function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Уже подключено")
        return
    }
    
    updateConnectionStatus("connecting", "Подключение...")
    updateButtonStates(false)
    
    socket = new WebSocket("ws://localhost:8080")
    
    socket.onopen = () => {
        console.log("Соединение установлено")
        updateConnectionStatus("connected", "Подключено к серверу")
        updateButtonStates(true)
        
        buyButtons.forEach(button => {
            const productElement = button.parentElement
            const availability = parseInt(productElement.querySelector('.availability').textContent)
            button.disabled = availability <= 0
        })
    }
    
    socket.onerror = (error) => {
        console.error("Ошибка соединения:", error)
        updateConnectionStatus("disconnected", "Ошибка подключения")
        updateButtonStates(false)
    }
    
    socket.onclose = () => {
        console.log("Соединение закрыто")
        updateConnectionStatus("disconnected", "Соединение закрыто")
        updateButtonStates(false)
        socket = null
    }
    
    socket.onmessage = function (event) {
        try {
            const message = JSON.parse(event.data)
            console.log("Получено сообщение:", JSON.stringify(message, null, 2))
            
            if (message.type === 'reset' && message.products) {
                console.log("Сброс товаров к изначальному состоянию")
                Object.keys(message.products).forEach(productId => {
                    const product = message.products[productId]
                    const availabilityElement = document.querySelector(`.product[data-product-id="${productId}"] .availability`)
                    const buyButton = document.querySelector(`.product[data-product-id="${productId}"] .buy-btn`)
                    
                    if (availabilityElement && buyButton) {
                        availabilityElement.textContent = product.availability
                        buyButton.disabled = false
                        buyButton.textContent = "Купить"
                        availabilityElement.style.color = "#28a745"
                    }
                })
            } else if (message.productId && message.availability !== undefined) {
                const productId = message.productId
                const updatedAvailability = message.availability
                const availabilityElement = document.querySelector(`.product[data-product-id="${productId}"] .availability`)
                const buyButton = document.querySelector(`.product[data-product-id="${productId}"] .buy-btn`)
                
                if (availabilityElement) {
                    availabilityElement.textContent = updatedAvailability
                    
                    if (buyButton) {
                        if (updatedAvailability <= 0) {
                            buyButton.disabled = true
                            buyButton.textContent = "Нет в наличии"
                            availabilityElement.style.color = "#dc3545"
                        } else {
                            buyButton.disabled = false
                            buyButton.textContent = "Купить"
                            availabilityElement.style.color = "#28a745"
                        }
                    }
                } else {
                    console.warn("Элемент не найден для productId:", productId)
                }
            } else if (message.error && message.productId) {
                console.warn("Ошибка от сервера:", message.error)
                const availabilityElement = document.querySelector(`.product[data-product-id="${message.productId}"] .availability`)
                const buyButton = document.querySelector(`.product[data-product-id="${message.productId}"] .buy-btn`)
                
                if (availabilityElement && buyButton) {
                    availabilityElement.textContent = "0"
                    buyButton.disabled = true
                    buyButton.textContent = "Нет в наличии"
                    availabilityElement.style.color = "#dc3545"
                }
            } else {
                console.log("Неизвестный тип сообщения:", JSON.stringify(message, null, 2))
            }
        } catch (error) {
            console.error("Ошибка обработки сообщения:", error)
        }
    }
}

function disconnectWebSocket() {
    if (socket) {
        socket.close()
        socket = null
        console.log("Отключение инициировано пользователем")
    }
}

function buyProduct(productId) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = {
            productId: productId,
            action: "buy",
        }
        socket.send(JSON.stringify(message))
        console.log("Отправлено:", message)
    } else {
        console.warn("Соединение не активно. Покупка невозможна.")
    }
}

connectBtn.addEventListener("click", connectWebSocket)
disconnectBtn.addEventListener("click", disconnectWebSocket)

buyButtons.forEach((button) => {
    button.addEventListener("click", function () {
        const productId = this.parentElement.getAttribute("data-product-id")
        buyProduct(productId)
    })
})

updateConnectionStatus("disconnected", "Отключено")
updateButtonStates(false) 