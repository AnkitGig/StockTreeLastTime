const express = require("express")
const cors = require("cors")
const http = require("http")
const path = require("path")
require("dotenv").config()

// Import services and configurations
const { connectDatabase } = require("./src/config/database")
const { initializeWebSocketServer } = require("./src/services/websocketService")
const { startMarketDataScheduler } = require("./src/services/schedulerService")
const { startMarketBroadcastLoop } = require("./liveMarketStreamer")
const { setupRoutes } = require("./src/routes")
const { errorHandler } = require("./src/middleware/errorHandler")
const { requestLogger } = require("./src/middleware/logger")

// Initialize Express app
const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(requestLogger)

// Serve static files
app.use(express.static(path.join(__dirname, "public")))

// Connect to database (optional for file-based storage)
if (process.env.MONGODB_URI) {
  connectDatabase()
}

// Setup routes
setupRoutes(app)

// Serve web interfaces
app.get("/viewer", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stock-viewer.html"))
})

app.get("/analytics", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "price-analytics.html"))
})

// Error handling middleware
app.use(errorHandler)

// Initialize WebSocket server
initializeWebSocketServer(server)

// Start market data scheduler
startMarketDataScheduler()

// Start server
server.listen(PORT, () => {
  console.log("🚀 Angel Broking Enhanced Backend Server Started")
  console.log(`📡 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log("📊 Real-time market data service active")
  console.log("🚫 Database saving: DISABLED (Live streaming only)")
  console.log("\n🔗 Web Interfaces:")
  console.log(`   📊 Stock Viewer: http://localhost:${PORT}/viewer`)
  console.log(`   📈 Price Analytics: http://localhost:${PORT}/analytics`)

  // Environment check
  console.log("\n🔧 Configuration Check:")
  console.log(`   CLIENT_CODE: ${process.env.CLIENT_CODE ? "✅ Set" : "❌ Missing"}`)
  console.log(`   MPIN: ${process.env.MPIN ? "✅ Set" : "❌ Missing"}`)
  console.log(`   SMARTAPI_KEY: ${process.env.SMARTAPI_KEY ? "✅ Set" : "❌ Missing"}`)
  console.log(`   TOTP_SECRET: ${process.env.TOTP_SECRET ? "✅ Set" : "❌ Missing"}`)
  console.log(
    `   MONGODB_URI: ${process.env.MONGODB_URI ? "✅ Set (Not used for live data)" : "❌ Not Required (Live streaming only)"}`,
  )

  console.log("\n📈 Live Streaming Features:")
  console.log("   ✅ Real-time price broadcasting")
  console.log("   ✅ WebSocket live updates")
  console.log("   ✅ Live price analytics")
  console.log("   ✅ Technical indicators")
  console.log("   🚫 Database saving disabled")
  console.log("   📡 Broadcast-only mode active")

  startMarketBroadcastLoop()
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  server.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})
