const { websocketService } = require("./src/services/websocketService")
const marketDataService = require("./src/services/marketDataService")
const authService = require("./src/services/authService")

async function startMarketBroadcastLoop() {
  console.log("🚀 Starting live market broadcast loop (Database saving disabled)")

  setInterval(async () => {
    try {
      const authToken = authService.getAuthToken()

      if (!authToken) {
        console.warn("⚠️ No auth token available. Skipping broadcast.")
        return
      }

      const result = await marketDataService.fetchMarketData(authToken, "FULL")

      if (result.success) {
        // Only broadcast, don't save to database
        websocketService.broadcastMarketData(result.data)
        console.log(`📡 Live data broadcasted: ${result.data.length} stocks (No DB save)`)
      } else {
        console.warn("⚠️ Failed to fetch live market data:", result)
      }
    } catch (error) {
      console.error("❌ Broadcast error:", error.message)
    }
  }, 5000) // Broadcast every 5 seconds instead of 1 second to reduce load
}

module.exports = { startMarketBroadcastLoop }
