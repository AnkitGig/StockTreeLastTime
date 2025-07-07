const WebSocket = require("ws")
const marketDataService = require("./marketDataService")

class WebSocketService {
  constructor() {
    this.wss = null
    this.clients = new Set()
    this.server = null
  }

  initialize(server) {
    this.server = server

    // Create WebSocket server
    this.wss = new WebSocket.Server({
      server: server,
      path: "/ws",
    })

    this.wss.on("connection", (ws, request) => {
      console.log("👤 New WebSocket client connected")
      this.clients.add(ws)

      // Send initial market data
      this.sendInitialData(ws)

      // Handle client messages
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message)
          this.handleClientMessage(ws, data)
        } catch (error) {
          console.error("❌ Error parsing client message:", error)
        }
      })

      // Handle client disconnect
      ws.on("close", () => {
        console.log("👤 WebSocket client disconnected")
        this.clients.delete(ws)
      })

      // Handle errors
      ws.on("error", (error) => {
        console.error("❌ WebSocket client error:", error)
        this.clients.delete(ws)
      })
    })

    console.log("🔌 WebSocket server initialized")
  }

  async sendInitialData(ws) {
    try {
      const latestData = await marketDataService.getLatestMarketData()

      const message = {
        type: "INITIAL_DATA",
        data: latestData,
        timestamp: new Date().toISOString(),
      }

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    } catch (error) {
      console.error("❌ Error sending initial data:", error)
    }
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case "PING":
        this.sendMessage(ws, { type: "PONG", timestamp: new Date().toISOString() })
        break

      case "SUBSCRIBE":
        // Handle symbol subscription
        console.log(`📊 Client subscribed to: ${data.symbols}`)
        break

      case "UNSUBSCRIBE":
        // Handle symbol unsubscription
        console.log(`📊 Client unsubscribed from: ${data.symbols}`)
        break

      default:
        console.log("❓ Unknown message type:", data.type)
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  broadcastMarketData(marketData) {
    const message = {
      type: "MARKET_UPDATE",
      data: marketData,
      timestamp: new Date().toISOString(),
    }

    this.broadcast(message)
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message)
    let broadcastCount = 0

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr)
        broadcastCount++
      }
    })

    if (broadcastCount > 0) {
      console.log(`📡 Broadcasted to ${broadcastCount} connected clients`)
    } else {
      console.log(`📡 No clients connected - data ready for broadcast`)
    }
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      isRunning: !!this.wss,
    }
  }
}

const websocketService = new WebSocketService()

const initializeWebSocketServer = (server) => {
  websocketService.initialize(server)
}

module.exports = {
  websocketService,
  initializeWebSocketServer,
}
