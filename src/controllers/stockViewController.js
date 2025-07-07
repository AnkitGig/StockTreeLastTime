const jsonFileService = require("../services/jsonFileService")

const getAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 50, exchange, search, sortBy = "symbol", sortOrder = "asc" } = req.query

    let stocks = await jsonFileService.loadSymbolMaster()

    // Filter by exchange
    if (exchange && exchange.toUpperCase() !== "ALL") {
      stocks = stocks.filter((stock) => stock.exchange === exchange.toUpperCase())
    }

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase()
      stocks = stocks.filter(
        (stock) => stock.symbol.toLowerCase().includes(searchTerm) || stock.name.toLowerCase().includes(searchTerm),
      )
    }

    // Sort stocks
    stocks.sort((a, b) => {
      let aVal = a[sortBy] || ""
      let bVal = b[sortBy] || ""

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    // Pagination
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedStocks = stocks.slice(startIndex, endIndex)

    // Exchange statistics
    const exchangeStats = {}
    const allStocks = await jsonFileService.loadSymbolMaster()
    allStocks.forEach((stock) => {
      exchangeStats[stock.exchange] = (exchangeStats[stock.exchange] || 0) + 1
    })

    res.json({
      success: true,
      data: {
        stocks: paginatedStocks,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(stocks.length / limitNum),
          totalItems: stocks.length,
          itemsPerPage: limitNum,
          hasNext: endIndex < stocks.length,
          hasPrev: pageNum > 1,
        },
        filters: {
          exchange: exchange || "ALL",
          search: search || "",
          sortBy,
          sortOrder,
        },
        exchangeStats,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getStocksByExchange = async (req, res) => {
  try {
    const { exchange } = req.params
    const { page = 1, limit = 50, search, sortBy = "symbol", sortOrder = "asc" } = req.query

    let stocks = await jsonFileService.loadSymbolMaster()

    // Filter by exchange
    stocks = stocks.filter((stock) => stock.exchange === exchange.toUpperCase())

    // Search filter
    if (search) {
      const searchTerm = search.toLowerCase()
      stocks = stocks.filter(
        (stock) => stock.symbol.toLowerCase().includes(searchTerm) || stock.name.toLowerCase().includes(searchTerm),
      )
    }

    // Sort stocks
    stocks.sort((a, b) => {
      let aVal = a[sortBy] || ""
      let bVal = b[sortBy] || ""

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    // Pagination
    const pageNum = Number.parseInt(page)
    const limitNum = Number.parseInt(limit)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedStocks = stocks.slice(startIndex, endIndex)

    res.json({
      success: true,
      data: {
        exchange: exchange.toUpperCase(),
        stocks: paginatedStocks,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(stocks.length / limitNum),
          totalItems: stocks.length,
          itemsPerPage: limitNum,
          hasNext: endIndex < stocks.length,
          hasPrev: pageNum > 1,
        },
        filters: {
          search: search || "",
          sortBy,
          sortOrder,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const searchStocks = async (req, res) => {
  try {
    const { q: searchTerm, exchange, limit = 20 } = req.query

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
      exchange: exchange || "ALL",
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

const getStockDetails = async (req, res) => {
  try {
    const { identifier } = req.params

    let stock = null

    // Search by token first
    if (/^\d+$/.test(identifier)) {
      stock = await jsonFileService.getSymbolByToken(identifier)
    }

    // If not found by token, search by symbol
    if (!stock) {
      const results = await jsonFileService.searchSymbols(identifier, 1)
      stock = results.length > 0 ? results[0] : null
    }

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock "${identifier}" not found`,
      })
    }

    // Get price history if available
    let priceHistory = []
    try {
      priceHistory = await jsonFileService.getPriceHistory(stock.token, 7)
    } catch (error) {
      console.warn("Could not fetch price history:", error.message)
    }

    res.json({
      success: true,
      data: {
        stock,
        priceHistory: priceHistory.slice(0, 10), // Last 10 price points
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

const getExchangeStats = async (req, res) => {
  try {
    const stocks = await jsonFileService.loadSymbolMaster()

    const exchangeStats = {}
    const instrumentStats = {}

    stocks.forEach((stock) => {
      // Exchange stats
      exchangeStats[stock.exchange] = (exchangeStats[stock.exchange] || 0) + 1

      // Instrument type stats
      const instrument = stock.instrumenttype || "Unknown"
      instrumentStats[instrument] = (instrumentStats[instrument] || 0) + 1
    })

    const topExchanges = Object.entries(exchangeStats)
      .sort(([, a], [, b]) => b - a)
      .map(([exchange, count]) => ({ exchange, count }))

    const topInstruments = Object.entries(instrumentStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([instrument, count]) => ({ instrument, count }))

    res.json({
      success: true,
      data: {
        totalStocks: stocks.length,
        exchanges: topExchanges,
        instruments: topInstruments,
        summary: {
          NSE: exchangeStats.NSE || 0,
          BSE: exchangeStats.BSE || 0,
          NFO: exchangeStats.NFO || 0,
          BFO: exchangeStats.BFO || 0,
          MCX: exchangeStats.MCX || 0,
          CDS: exchangeStats.CDS || 0,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getAllStocks,
  getStocksByExchange,
  searchStocks,
  getStockDetails,
  getExchangeStats,
}
