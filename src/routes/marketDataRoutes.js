const express = require("express")
const router = express.Router()
const marketDataController = require("../controllers/marketDataController")

// GET /api/market-data - Get all market data
router.get("/", marketDataController.getMarketData)

// GET /api/market-data/latest - Get latest prices
router.get("/latest", marketDataController.getLatestPrices)

// GET /api/market-data/stats - Get market data statistics
router.get("/stats", marketDataController.getMarketStats)

// GET /api/market-data/symbol/:symbol - Get data for specific symbol
router.get("/symbol/:symbol", marketDataController.getMarketDataBySymbol)

// POST /api/market-data/fetch - Fetch fresh data from Angel Broking
router.post("/fetch", marketDataController.fetchFreshData)

// GET /api/market-data/live - Get live data without saving to database
router.get("/live", marketDataController.getLiveDataOnly)

module.exports = router
