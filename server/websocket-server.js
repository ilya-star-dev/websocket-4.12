const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 8080 })

const initialProducts = {
    '1': { name: 'Товар 1', availability: 10 },
    '2': { name: 'Товар 2', availability: 5 },
    '3': { name: 'Товар 3', availability: 3 }
}

let products = {}

function resetProducts() {
    products = JSON.parse(JSON.stringify(initialProducts))
    console.log('Товары сброшены к изначальному состоянию')
}

wss.on('connection', function connection(ws) {
    console.log('Новое подключение')
    resetProducts()
    
    ws.send(JSON.stringify({
        type: 'reset',
        products: products
    }))

    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message)
            console.log('Получено:', data)

            if (data.action === 'buy' && data.productId) {
                const product = products[data.productId]
                if (product && product.availability > 0) {
                    product.availability--
                    
                    const response = {
                        productId: data.productId,
                        availability: product.availability,
                        status: 'success'
                    }
                    
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(response))
                        }
                    })
                } else {
                    ws.send(JSON.stringify({
                        productId: data.productId,
                        availability: 0,
                        error: 'Товар закончился'
                    }))
                }
            }
        } catch (error) {
            console.error('Ошибка:', error)
        }
    })

    ws.on('close', function() {
        console.log('Соединение закрыто')
    })
})

console.log('WebSocket сервер запущен на порту 8080') 