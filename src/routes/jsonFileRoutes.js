const express = require("express")
const router = express.Router()
const jsonFileController = require("../controllers/jsonFileController")

// Symbol Master Management
router.post("/sync", jsonFileController.syncSymbolMaster)
router.get("/search", jsonFileController.searchSymbols)
router.get("/symbol/:token", jsonFileController.getSymbolByToken)

// Search Analytics
router.get("/popular-searches", jsonFileController.getPopularSearches)

// Watchlist Management
router.post("/watchlist", jsonFileController.createWatchList)
router.get("/watchlists", jsonFileController.getWatchLists)
router.post("/watchlist/:watchListId/add", jsonFileController.addToWatchList)

// Price History
router.get("/price-history/:token", jsonFileController.getPriceHistory)

// Collection Statistics & File Info
router.get("/stats", jsonFileController.getCollectionStats)
router.get("/files", jsonFileController.getFileInfo)

// Data Export & Management
router.get("/export/:collection", jsonFileController.exportCollection)
router.delete("/clear-all", jsonFileController.clearAllData)

module.exports = router
