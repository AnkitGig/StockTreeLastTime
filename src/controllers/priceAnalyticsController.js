const priceAnalyticsService = require("../services/priceAnalyticsService")
const jsonFileService = require("../services/jsonFileService")

const getLivePriceWithAnalytics = async (req, res) => {
  try {
    const { identifier } = req.params

    // Find stock by token or symbol
    let stock = null
    if (/^\d+$/.test(identifier)) {
      stock = await jsonFileService.getSymbolByToken(identifier)
    } else {
      const results = await jsonFileService.searchSymbols(identifier, 1)
      stock = results.length > 0 ? results[0] : null
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock "${identifier}" not found`,
      })
    }

    const analytics = await priceAnalyticsService.getLivePriceWithAnalytics(stock.token, stock.symbol, stock.exchange)

    res.json({
      success: true,
      data: {
        stock,
        ...analytics,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getBulkPriceAnalytics = async (req, res) => {
  try {
    const { tokens } = req.body

    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({
        success: false,
        message: "Tokens array is required",
      })
    }

    const analytics = await priceAnalyticsService.getBulkPriceAnalytics(tokens)

    res.json({
      success: true,
      data: analytics,
      count: analytics.length,
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
    const { identifier } = req.params
    const { days = 30, interval = "daily" } = req.query

    // Find stock
    let stock = null
    if (/^\d+$/.test(identifier)) {
      stock = await jsonFileService.getSymbolByToken(identifier)
    } else {
      const results = await jsonFileService.searchSymbols(identifier, 1)
      stock = results.length > 0 ? results[0] : null
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock "${identifier}" not found`,
      })
    }

    const priceHistory = await jsonFileService.getPriceHistory(stock.token, Number.parseInt(days))

    // Process history for different intervals
    let processedHistory = priceHistory
    if (interval === "weekly") {
      processedHistory = this.aggregateToWeekly(priceHistory)
    } else if (interval === "monthly") {
      processedHistory = this.aggregateToMonthly(priceHistory)
    }

    res.json({
      success: true,
      data: {
        stock,
        history: processedHistory,
        interval,
        days: Number.parseInt(days),
        count: processedHistory.length,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getMarketOverview = async (req, res) => {
  try {
    const { exchange = "NSE", limit = 20 } = req.query

    // Get top stocks by market cap or volume
    const stocks = await jsonFileService.loadSymbolMaster()
    const filteredStocks = stocks
      .filter((stock) => stock.exchange === exchange.toUpperCase())
      .slice(0, Number.parseInt(limit))

    // Get analytics for these stocks
    const tokenInfo = filteredStocks.map((stock) => ({
      token: stock.token,
      symbol: stock.symbol,
      exchange: stock.exchange,
    }))

    const analytics = await priceAnalyticsService.getBulkPriceAnalytics(tokenInfo)

    res.json({
      success: true,
      data: {
        exchange: exchange.toUpperCase(),
        stocks: analytics,
        count: analytics.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getTopMovers = async (req, res) => {
  try {
    const { type = "gainers", exchange = "NSE", limit = 10 } = req.query

    // This would typically require real-time data
    // For now, return a placeholder response
    res.json({
      success: true,
      data: {
        type,
        exchange,
        stocks: [],
        message: "Top movers data requires real-time market feed",
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// Helper methods
function aggregateToWeekly(dailyData) {
  const weeklyData = []
  const weeks = {}

  dailyData.forEach((record) => {
    const date = new Date(record.timestamp)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekKey = weekStart.toISOString().split("T")[0]

    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        date: weekKey,
        open: record.priceData.open,
        high: record.priceData.high,
        low: record.priceData.low,
        close: record.priceData.ltp,
        volume: record.priceData.volume,
        records: [],
      }
    }

    weeks[weekKey].records.push(record)
    weeks[weekKey].high = Math.max(weeks[weekKey].high, record.priceData.high)
    weeks[weekKey].low = Math.min(weeks[weekKey].low, record.priceData.low)
    weeks[weekKey].volume += record.priceData.volume
  })

  return Object.values(weeks).sort((a, b) => new Date(b.date) - new Date(a.date))
}

function aggregateToMonthly(dailyData) {
  const monthlyData = []
  const months = {}

  dailyData.forEach((record) => {
    const date = new Date(record.timestamp)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!months[monthKey]) {
      months[monthKey] = {
        date: monthKey,
        open: record.priceData.open,
        high: record.priceData.high,
        low: record.priceData.low,
        close: record.priceData.ltp,
        volume: record.priceData.volume,
        records: [],
      }
    }

    months[monthKey].records.push(record)
    months[monthKey].high = Math.max(months[monthKey].high, record.priceData.high)
    months[monthKey].low = Math.min(months[monthKey].low, record.priceData.low)
    months[monthKey].volume += record.priceData.volume
  })

  return Object.values(months).sort((a, b) => b.date.localeCompare(a.date))
}

module.exports = {
  getLivePriceWithAnalytics,
  getBulkPriceAnalytics,
  getPriceHistory,
  getMarketOverview,
  getTopMovers,
}
