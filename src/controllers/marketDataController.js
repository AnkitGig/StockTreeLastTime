const marketDataService = require("../services/marketDataService")
const authService = require("../services/authService")
const MarketData = require("../models/MarketData")

const getMarketData = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 50
    const marketData = await MarketData.find().sort({ timestamp: -1 }).limit(limit)

    res.json({
      success: true,
      data: marketData,
      count: marketData.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getLatestPrices = async (req, res) => {
  try {
    const latestData = await marketDataService.getLatestMarketData()

    res.json({
      success: true,
      data: latestData,
      count: latestData.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getMarketDataBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params
    const limit = Number.parseInt(req.query.limit) || 100

    const marketData = await marketDataService.getMarketDataBySymbol(symbol, limit)

    res.json({
      success: true,
      data: marketData,
      symbol: symbol,
      count: marketData.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const fetchFreshData = async (req, res) => {
  try {
    if (!authService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      })
    }

    const authToken = authService.getAuthToken()
    const mode = req.query.mode || "FULL"

    const result = await marketDataService.fetchMarketData(authToken, mode)

    res.json({
      success: true,
      message: "Market data fetched successfully",
      fetchTime: result.fetchTime,
      recordCount: result.data.length,
      mode: mode,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getMarketStats = async (req, res) => {
  try {
    const totalRecords = await MarketData.countDocuments()
    const latestRecord = await MarketData.findOne().sort({ timestamp: -1 })
    const serviceStats = marketDataService.getStats()

    res.json({
      success: true,
      stats: {
        totalRecords,
        latestRecord: latestRecord
          ? {
              symbol: latestRecord.symbol,
              ltp: latestRecord.ltp,
              timestamp: latestRecord.timestamp,
            }
          : null,
        lastFetchTime: serviceStats.lastFetchTime,
        fetchCount: serviceStats.fetchCount,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getLiveDataOnly = async (req, res) => {
  try {
    if (!authService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      })
    }

    const authToken = authService.getAuthToken()
    const mode = req.query.mode || "FULL"

    // Fetch live data without saving to database
    const result = await marketDataService.fetchLiveDataOnly(authToken, mode)

    res.json({
      success: true,
      message: "Live market data fetched successfully (not saved to DB)",
      fetchTime: result.fetchTime,
      recordCount: result.data.length,
      mode: mode,
      data: result.data,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getMarketData,
  getLatestPrices,
  getMarketDataBySymbol,
  fetchFreshData,
  getMarketStats,
  getLiveDataOnly, // Add this new endpoint
}
