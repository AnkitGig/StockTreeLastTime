const fs = require("fs").promises
const path = require("path")
const axios = require("axios")

class JsonFileService {
  constructor() {
    this.dataDir = path.join(__dirname, "../../data")
    this.symbolMasterUrl = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    this.files = {
      symbolMaster: path.join(this.dataDir, "symbol-master.json"),
      searchHistory: path.join(this.dataDir, "search-history.json"),
      priceHistory: path.join(this.dataDir, "price-history.json"),
      watchLists: path.join(this.dataDir, "watchlists.json"),
      popularSearches: path.join(this.dataDir, "popular-searches.json"),
      stats: path.join(this.dataDir, "collection-stats.json"),
    }
    this.cache = {}
    this.lastSyncTime = null
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error
      }
    }
  }

  /**
   * Read JSON file with error handling
   */
  async readJsonFile(filePath, defaultValue = []) {
    try {
      const data = await fs.readFile(filePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      if (error.code === "ENOENT") {
        // File doesn't exist, return default value
        return defaultValue
      }
      console.error(`❌ Error reading ${filePath}:`, error.message)
      return defaultValue
    }
  }

  /**
   * Write JSON file with formatting (DISABLED: No data will be saved)
   */
  async writeJsonFile(filePath, data) {
    // Data saving is disabled as per request
    console.warn(`⚠️ Data save is disabled. Skipping write to ${filePath}`)
    return true
  }

  /**
   * Download and save symbol master data
   */
  async downloadAndSaveSymbolMaster() {
    try {
      console.log("📥 Downloading Symbol Master file...")

      const response = await axios.get(this.symbolMasterUrl, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      const symbolData = response.data
      console.log(`✅ Downloaded ${symbolData.length} symbols`)

      // Process and enhance data
      const processedData = symbolData.map((item) => ({
        token: item.token,
        symbol: item.symbol,
        name: item.name,
        exchange: item.exch_seg,
        exch_seg: item.exch_seg,
        instrumenttype: item.instrumenttype || "",
        strike: Number.parseFloat(item.strike) || 0,
        tick_size: Number.parseFloat(item.tick_size) || 0.05,
        lot_size: Number.parseInt(item.lot_size) || 1,
        expiry: item.expiry || "",
        gen_num: Number.parseInt(item.gen_num) || 0,
        precision: Number.parseInt(item.precision) || 2,
        multiplier: Number.parseInt(item.multiplier) || 1,
        isin: item.isin || "",
        isActive: true,
        lastUpdated: new Date().toISOString(),
      }))

      // Save to file
      await this.writeJsonFile(this.files.symbolMaster, {
        metadata: {
          totalSymbols: processedData.length,
          downloadTime: new Date().toISOString(),
          source: this.symbolMasterUrl,
          version: "1.0",
        },
        data: processedData,
      })

      // Update cache
      this.cache.symbolMaster = processedData
      this.lastSyncTime = new Date()

      // Update stats
      await this.updateStats()

      console.log(`💾 Saved ${processedData.length} symbols to ${this.files.symbolMaster}`)

      return {
        success: true,
        total: processedData.length,
        syncTime: this.lastSyncTime,
        filePath: this.files.symbolMaster,
      }
    } catch (error) {
      console.error("❌ Error downloading symbol master:", error.message)
      throw error
    }
  }

  /**
   * Load symbol master from file
   */
  async loadSymbolMaster() {
    if (this.cache.symbolMaster) {
      return this.cache.symbolMaster
    }

    const fileData = await this.readJsonFile(this.files.symbolMaster, { data: [] })
    this.cache.symbolMaster = fileData.data || []
    return this.cache.symbolMaster
  }

  /**
   * Search symbols in loaded data
   */
  async searchSymbols(searchTerm, limit = 10, exchange = null) {
    try {
      const symbolData = await this.loadSymbolMaster()
      const searchRegex = new RegExp(searchTerm, "i")

      let results = symbolData.filter((item) => {
        const matchesSearch = searchRegex.test(item.symbol) || searchRegex.test(item.name)
        const matchesExchange = !exchange || item.exchange === exchange
        return matchesSearch && matchesExchange && item.isActive
      })

      // Sort by relevance (exact matches first)
      results.sort((a, b) => {
        const aExact = a.symbol.toLowerCase() === searchTerm.toLowerCase()
        const bExact = b.symbol.toLowerCase() === searchTerm.toLowerCase()
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.symbol.localeCompare(b.symbol)
      })

      results = results.slice(0, limit)

      // Log search
      await this.logSearch(searchTerm, results.length > 0 ? "FOUND" : "NOT_FOUND", results.length)

      return results
    } catch (error) {
      console.error("❌ Error searching symbols:", error.message)
      throw error
    }
  }

  /**
   * Get symbol by token
   */
  async getSymbolByToken(token) {
    try {
      const symbolData = await this.loadSymbolMaster()
      return symbolData.find((item) => item.token === token && item.isActive)
    } catch (error) {
      console.error("❌ Error getting symbol by token:", error.message)
      throw error
    }
  }

  /**
   * Log search history
   */
  async logSearch(searchTerm, searchType, resultCount, selectedSymbol = null) {
    try {
      const searchHistory = await this.readJsonFile(this.files.searchHistory, [])

      const searchEntry = {
        id: Date.now().toString(),
        searchTerm,
        searchType,
        resultFound: resultCount > 0,
        resultCount,
        selectedSymbol,
        searchTime: new Date().toISOString(),
        timestamp: Date.now(),
      }

      searchHistory.unshift(searchEntry)

      // Keep only last 1000 searches
      if (searchHistory.length > 1000) {
        searchHistory.splice(1000)
      }

      await this.writeJsonFile(this.files.searchHistory, searchHistory)

      // Update popular searches
      await this.updatePopularSearches()
    } catch (error) {
      console.error("❌ Error logging search:", error.message)
    }
  }

  /**
   * Update popular searches
   */
  async updatePopularSearches() {
    try {
      const searchHistory = await this.readJsonFile(this.files.searchHistory, [])

      // Count search terms
      const searchCounts = {}
      searchHistory.forEach((entry) => {
        if (entry.resultFound) {
          const term = entry.searchTerm.toLowerCase()
          searchCounts[term] = (searchCounts[term] || 0) + 1
        }
      })

      // Sort by count
      const popularSearches = Object.entries(searchCounts)
        .map(([term, count]) => ({
          searchTerm: term,
          count,
          lastSearched: searchHistory.find((entry) => entry.searchTerm.toLowerCase() === term)?.searchTime,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50)

      await this.writeJsonFile(this.files.popularSearches, {
        metadata: {
          totalUniqueSearches: popularSearches.length,
          lastUpdated: new Date().toISOString(),
        },
        data: popularSearches,
      })
    } catch (error) {
      console.error("❌ Error updating popular searches:", error.message)
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10) {
    try {
      const fileData = await this.readJsonFile(this.files.popularSearches, { data: [] })
      return fileData.data.slice(0, limit)
    } catch (error) {
      console.error("❌ Error getting popular searches:", error.message)
      return []
    }
  }

  /**
   * Save price data
   */
  async savePriceData(token, symbol, exchange, priceData, technicalData = {}) {
    try {
      const priceHistory = await this.readJsonFile(this.files.priceHistory, [])

      const priceEntry = {
        id: `${token}_${Date.now()}`,
        token,
        symbol,
        exchange,
        priceData: {
          ltp: priceData.ltp || 0,
          open: priceData.open || 0,
          high: priceData.high || 0,
          low: priceData.low || 0,
          close: priceData.close || 0,
          volume: priceData.volume || 0,
          change: priceData.change || 0,
          changePercent: priceData.changePercent || 0,
        },
        technicalIndicators: technicalData,
        dataSource: "SMARTAPI",
        timestamp: new Date().toISOString(),
        timestampMs: Date.now(),
      }

      priceHistory.unshift(priceEntry)

      // Keep only last 10000 price entries
      if (priceHistory.length > 10000) {
        priceHistory.splice(10000)
      }

      await this.writeJsonFile(this.files.priceHistory, priceHistory)

      return priceEntry
    } catch (error) {
      console.error("❌ Error saving price data:", error.message)
      throw error
    }
  }

  /**
   * Get price history for symbol
   */
  async getPriceHistory(token, days = 30) {
    try {
      const priceHistory = await this.readJsonFile(this.files.priceHistory, [])
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000

      return priceHistory
        .filter((entry) => entry.token === token && entry.timestampMs > cutoffTime)
        .sort((a, b) => b.timestampMs - a.timestampMs)
        .slice(0, 1000)
    } catch (error) {
      console.error("❌ Error getting price history:", error.message)
      throw error
    }
  }

  /**
   * Create watchlist
   */
  async createWatchList(name, symbols = [], userId = "default_user") {
    try {
      const watchLists = await this.readJsonFile(this.files.watchLists, [])

      const watchList = {
        id: Date.now().toString(),
        name,
        description: "",
        symbols: symbols.map((symbol) => ({
          ...symbol,
          addedAt: new Date().toISOString(),
          alertSettings: {
            priceAlert: { enabled: false, targetPrice: 0, alertType: "ABOVE" },
            changeAlert: { enabled: false, changePercent: 5, alertType: "BOTH" },
          },
        })),
        isDefault: watchLists.length === 0,
        isActive: true,
        userId,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
      }

      watchLists.push(watchList)
      await this.writeJsonFile(this.files.watchLists, watchLists)

      return watchList
    } catch (error) {
      console.error("❌ Error creating watchlist:", error.message)
      throw error
    }
  }

  /**
   * Add symbol to watchlist
   */
  async addToWatchList(watchListId, symbolData) {
    try {
      const watchLists = await this.readJsonFile(this.files.watchLists, [])
      const watchList = watchLists.find((wl) => wl.id === watchListId)

      if (!watchList) {
        throw new Error("Watchlist not found")
      }

      // Check if symbol already exists
      const exists = watchList.symbols.find((s) => s.token === symbolData.token)
      if (exists) {
        throw new Error("Symbol already in watchlist")
      }

      watchList.symbols.push({
        ...symbolData,
        addedAt: new Date().toISOString(),
        alertSettings: {
          priceAlert: { enabled: false, targetPrice: 0, alertType: "ABOVE" },
          changeAlert: { enabled: false, changePercent: 5, alertType: "BOTH" },
        },
      })

      watchList.lastAccessed = new Date().toISOString()

      await this.writeJsonFile(this.files.watchLists, watchLists)
      return watchList
    } catch (error) {
      console.error("❌ Error adding to watchlist:", error.message)
      throw error
    }
  }

  /**
   * Get all watchlists
   */
  async getWatchLists(userId = "default_user") {
    try {
      const watchLists = await this.readJsonFile(this.files.watchLists, [])
      return watchLists.filter((wl) => wl.userId === userId && wl.isActive)
    } catch (error) {
      console.error("❌ Error getting watchlists:", error.message)
      return []
    }
  }

  /**
   * Update collection statistics
   */
  async updateStats() {
    try {
      const symbolData = await this.loadSymbolMaster()
      const searchHistory = await this.readJsonFile(this.files.searchHistory, [])
      const priceHistory = await this.readJsonFile(this.files.priceHistory, [])
      const watchLists = await this.readJsonFile(this.files.watchLists, [])

      // Exchange distribution
      const exchangeStats = {}
      symbolData.forEach((symbol) => {
        exchangeStats[symbol.exchange] = (exchangeStats[symbol.exchange] || 0) + 1
      })

      const stats = {
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0",
        },
        collections: {
          symbols: symbolData.length,
          searches: searchHistory.length,
          priceHistory: priceHistory.length,
          watchLists: watchLists.filter((wl) => wl.isActive).length,
        },
        exchanges: Object.entries(exchangeStats)
          .map(([exchange, count]) => ({ exchange, count }))
          .sort((a, b) => b.count - a.count),
        recentSearches: searchHistory.slice(0, 10).map((s) => ({
          term: s.searchTerm,
          found: s.resultFound,
          time: s.searchTime,
        })),
        lastSyncTime: this.lastSyncTime?.toISOString() || null,
        filePaths: this.files,
      }

      await this.writeJsonFile(this.files.stats, stats)
      return stats
    } catch (error) {
      console.error("❌ Error updating stats:", error.message)
      throw error
    }
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    try {
      const stats = await this.readJsonFile(this.files.stats, {})
      if (!stats.metadata) {
        // Generate stats if not exists
        return await this.updateStats()
      }
      return stats
    } catch (error) {
      console.error("❌ Error getting stats:", error.message)
      throw error
    }
  }

  /**
   * Export collection data
   */
  async exportCollection(collection, limit = 1000) {
    try {
      let data = []
      let filePath = ""

      switch (collection) {
        case "symbols":
          data = await this.loadSymbolMaster()
          filePath = this.files.symbolMaster
          break
        case "searches":
          data = await this.readJsonFile(this.files.searchHistory, [])
          filePath = this.files.searchHistory
          break
        case "prices":
          data = await this.readJsonFile(this.files.priceHistory, [])
          filePath = this.files.priceHistory
          break
        case "watchlists":
          data = await this.readJsonFile(this.files.watchLists, [])
          filePath = this.files.watchLists
          break
        case "popular":
          const popularData = await this.readJsonFile(this.files.popularSearches, { data: [] })
          data = popularData.data
          filePath = this.files.popularSearches
          break
        default:
          throw new Error("Invalid collection name")
      }

      return {
        collection,
        count: data.length,
        exportTime: new Date().toISOString(),
        filePath,
        data: data.slice(0, limit),
      }
    } catch (error) {
      console.error("❌ Error exporting collection:", error.message)
      throw error
    }
  }

  /**
   * Get file sizes and info
   */
  async getFileInfo() {
    try {
      const fileInfo = {}

      for (const [name, filePath] of Object.entries(this.files)) {
        try {
          const stats = await fs.stat(filePath)
          fileInfo[name] = {
            path: filePath,
            size: stats.size,
            sizeFormatted: this.formatBytes(stats.size),
            lastModified: stats.mtime.toISOString(),
            exists: true,
          }
        } catch (error) {
          fileInfo[name] = {
            path: filePath,
            size: 0,
            sizeFormatted: "0 B",
            lastModified: null,
            exists: false,
          }
        }
      }

      return fileInfo
    } catch (error) {
      console.error("❌ Error getting file info:", error.message)
      throw error
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  /**
   * Clear all data files
   */
  async clearAllData() {
    try {
      for (const filePath of Object.values(this.files)) {
        try {
          await fs.unlink(filePath)
          console.log(`🗑️ Deleted ${filePath}`)
        } catch (error) {
          if (error.code !== "ENOENT") {
            console.warn(`⚠️ Could not delete ${filePath}:`, error.message)
          }
        }
      }

      // Clear cache
      this.cache = {}
      this.lastSyncTime = null

      console.log("✅ All data files cleared")
      return true
    } catch (error) {
      console.error("❌ Error clearing data:", error.message)
      throw error
    }
  }
}

module.exports = new JsonFileService()
