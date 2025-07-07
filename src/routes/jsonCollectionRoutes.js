const express = require("express")
const router = express.Router()
const jsonCollectionController = require("../controllers/jsonCollectionController")

// Symbol Master Management
router.post("/sync", jsonCollectionController.syncSymbolMaster)
router.get("/search", jsonCollectionController.searchSymbols)
router.get("/symbol/:token", jsonCollectionController.getSymbolByToken)

// Search Analytics
router.get("/popular-searches", jsonCollectionController.getPopularSearches)

// Watchlist Management
router.post("/watchlist", jsonCollectionController.createWatchList)
router.post("/watchlist/:watchListId/add", jsonCollectionController.addToWatchList)

// Price History
router.get("/price-history/:token", jsonCollectionController.getPriceHistory)

// Collection Statistics
router.get("/stats", jsonCollectionController.getCollectionStats)

// Data Export
router.get("/export/:collection", jsonCollectionController.exportCollection)

module.exports = router
