const marketDataRoutes = require("./marketDataRoutes")
const authRoutes = require("./authRoutes")
const systemRoutes = require("./systemRoutes")
const jsonFileRoutes = require("./jsonFileRoutes")
const stockViewRoutes = require("./stockViewRoutes")
const priceAnalyticsRoutes = require("./priceAnalyticsRoutes")

const setupRoutes = (app) => {
  // API routes
  app.use("/api/market-data", marketDataRoutes)
  app.use("/api/auth", authRoutes)
  app.use("/api/system", systemRoutes)
  app.use("/api/files", jsonFileRoutes)
  app.use("/api/stocks", stockViewRoutes)
  app.use("/api/analytics", priceAnalyticsRoutes)

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      message: "Angel Broking Real-Time Market Data API - Enhanced with Price Analytics",
      version: "2.0.0",
      endpoints: {
        marketData: "/api/market-data",
        authentication: "/api/auth",
        system: "/api/system",
        files: "/api/files",
        stocks: "/api/stocks",
        analytics: "/api/analytics",
        websocket: "/ws",
      },
      features: [
        "Real-time price data",
        "Comprehensive price analytics",
        "52-week high/low tracking",
        "Monthly high/low analysis",
        "Technical indicators",
        "Price history charts",
        "Support/Resistance levels",
      ],
      webInterfaces: {
        stockViewer: "/viewer",
        priceAnalytics: "/analytics",
      },
      storage: "JSON Files + Real-time API",
      documentation: "https://github.com/your-repo/angel-broking-backend",
    })
  })

  console.log("📋 API routes configured with comprehensive price analytics")
}

module.exports = {
  setupRoutes,
}
