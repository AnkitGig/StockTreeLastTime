const express = require("express")
const router = express.Router()
const priceAnalyticsController = require("../controllers/priceAnalyticsController")

// Get live price with comprehensive analytics
router.get("/live/:identifier", priceAnalyticsController.getLivePriceWithAnalytics)

// Get bulk price analytics
router.post("/bulk", priceAnalyticsController.getBulkPriceAnalytics)

// Get price history with intervals
router.get("/history/:identifier", priceAnalyticsController.getPriceHistory)

// Get market overview
router.get("/market-overview", priceAnalyticsController.getMarketOverview)

// Get top movers
router.get("/top-movers", priceAnalyticsController.getTopMovers)

module.exports = router
