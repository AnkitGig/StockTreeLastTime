const jsonFileService = require("../services/jsonFileService")

const syncSymbolMaster = async (req, res) => {
  try {
    const result = await jsonFileService.downloadAndSaveSymbolMaster()

    res.json({
      success: true,
      message: "Symbol master synchronized successfully",
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const searchSymbols = async (req, res) => {
  try {
    const { q: searchTerm, limit = 10, exchange } = req.query

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: "Search term is required",
      })
    }

    const results = await jsonFileService.searchSymbols(searchTerm, Number.parseInt(limit), exchange)

    res.json({
      success: true,
      searchTerm,
      count: results.length,
      data: results,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getSymbolByToken = async (req, res) => {
  try {
    const { token } = req.params

    const symbol = await jsonFileService.getSymbolByToken(token)

    if (!symbol) {
      return res.status(404).json({
        success: false,
        message: "Symbol not found",
      })
    }

    res.json({
      success: true,
      data: symbol,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getPopularSearches = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const popularSearches = await jsonFileService.getPopularSearches(Number.parseInt(limit))

    res.json({
      success: true,
      count: popularSearches.length,
      data: popularSearches,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const createWatchList = async (req, res) => {
  try {
    const { name, symbols = [], userId = "default_user" } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Watchlist name is required",
      })
    }

    const watchList = await jsonFileService.createWatchList(name, symbols, userId)

    res.json({
      success: true,
      message: "Watchlist created successfully",
      data: watchList,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const addToWatchList = async (req, res) => {
  try {
    const { watchListId } = req.params
    const symbolData = req.body

    const updatedWatchList = await jsonFileService.addToWatchList(watchListId, symbolData)

    res.json({
      success: true,
      message: "Symbol added to watchlist",
      data: updatedWatchList,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getWatchLists = async (req, res) => {
  try {
    const { userId = "default_user" } = req.query

    const watchLists = await jsonFileService.getWatchLists(userId)

    res.json({
      success: true,
      count: watchLists.length,
      data: watchLists,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getPriceHistory = async (req, res) => {
  try {
    const { token } = req.params
    const { days = 30 } = req.query

    const priceHistory = await jsonFileService.getPriceHistory(token, Number.parseInt(days))

    res.json({
      success: true,
      token,
      days: Number.parseInt(days),
      count: priceHistory.length,
      data: priceHistory,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getCollectionStats = async (req, res) => {
  try {
    const stats = await jsonFileService.getStats()

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getFileInfo = async (req, res) => {
  try {
    const fileInfo = await jsonFileService.getFileInfo()

    res.json({
      success: true,
      data: fileInfo,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const exportCollection = async (req, res) => {
  try {
    const { collection } = req.params
    const { limit = 1000, download = false } = req.query

    const exportData = await jsonFileService.exportCollection(collection, Number.parseInt(limit))

    if (download === "true") {
      res.setHeader("Content-Type", "application/json")
      res.setHeader("Content-Disposition", `attachment; filename="${collection}-export.json"`)
      return res.send(JSON.stringify(exportData, null, 2))
    }

    res.json({
      success: true,
      export: exportData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const clearAllData = async (req, res) => {
  try {
    await jsonFileService.clearAllData()

    res.json({
      success: true,
      message: "All data files cleared successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  syncSymbolMaster,
  searchSymbols,
  getSymbolByToken,
  getPopularSearches,
  createWatchList,
  addToWatchList,
  getWatchLists,
  getPriceHistory,
  getCollectionStats,
  getFileInfo,
  exportCollection,
  clearAllData,
}
