const express = require("express")
const router = express.Router()
const stockViewController = require("../controllers/stockViewController")

// Get all stocks with filtering and pagination
router.get("/", stockViewController.getAllStocks)

// Get stocks by exchange (NSE, BSE, etc.)
router.get("/exchange/:exchange", stockViewController.getStocksByExchange)

// Search stocks
router.get("/search", stockViewController.searchStocks)

// Get stock details by symbol or token
router.get("/details/:identifier", stockViewController.getStockDetails)

// Get exchange statistics
router.get("/stats/exchanges", stockViewController.getExchangeStats)

module.exports = router
