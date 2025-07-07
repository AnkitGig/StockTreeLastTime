const StockSymbol = require("../models/StockSymbol")
const SearchHistory = require("../models/SearchHistory")
const PriceHistory = require("../models/PriceHistory")
const WatchList = require("../models/WatchList")
const axios = require("axios")

class JsonCollectionService {
  constructor() {
    this.symbolMasterUrl = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    this.lastSyncTime = null
    this.totalSymbols = 0
  }

  /**
   * Download and sync symbol master data to MongoDB
   */
  async syncSymbolMaster() {
    try {
      console.log("📥 Starting Symbol Master sync...")

      // Download fresh data
      const response = await axios.get(this.symbolMasterUrl, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      const symbolData = response.data
      console.log(`📊 Downloaded ${symbolData.length} symbols`)

      // Clear existing data (optional - comment out for incremental updates)
      // await StockSymbol.deleteMany({});

      // Batch insert with upsert
      const batchSize = 1000
      let processed = 0
      let inserted = 0
      let updated = 0

      for (let i = 0; i < symbolData.length; i += batchSize) {
        const batch = symbolData.slice(i, i + batchSize)

        const bulkOps = batch.map((item) => ({
          updateOne: {
            filter: { token: item.token },
            update: {
              $set: {
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
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        }))

        const result = await StockSymbol.bulkWrite(bulkOps)
        inserted += result.upsertedCount
        updated += result.modifiedCount
        processed += batch.length

        console.log(
          `📊 Processed: ${processed}/${symbolData.length} (${Math.round((processed / symbolData.length) * 100)}%)`,
        )
      }

      this.lastSyncTime = new Date()
      this.totalSymbols = symbolData.length

      console.log("✅ Symbol Master sync completed")
      console.log(`📊 Total: ${symbolData.length}, Inserted: ${inserted}, Updated: ${updated}`)

      return {
        success: true,
        total: symbolData.length,
        inserted,
        updated,
        syncTime: this.lastSyncTime,
      }
    } catch (error) {
      console.error("❌ Error syncing symbol master:", error.message)
      throw error
    }
  }

  /**
   * Search symbols in database
   */
  async searchSymbols(searchTerm, limit = 10, exchange = null) {
    try {
      const searchRegex = new RegExp(searchTerm, "i")
      const query = {
        $or: [{ symbol: searchRegex }, { name: searchRegex }],
        isActive: true,
      }

      if (exchange) {
        query.exchange = exchange
      }

      const results = await StockSymbol.find(query).limit(limit).sort({ symbol: 1 })

      // Log search history
      await this.logSearchHistory(searchTerm, results.length > 0 ? "PARTIAL" : "NOT_FOUND", results.length)

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
      return await StockSymbol.findOne({ token, isActive: true })
    } catch (error) {
      console.error("❌ Error getting symbol by token:", error.message)
      throw error
    }
  }

  /**
   * Save price data
   */
  async savePriceData(token, symbol, exchange, priceData, technicalData = {}) {
    try {
      const priceHistory = new PriceHistory({
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
        timestamp: new Date(),
      })

      return await priceHistory.save()
    } catch (error) {
      console.error("❌ Error saving price data:", error.message)
      throw error
    }
  }

  /**
   * Log search history
   */
  async logSearchHistory(searchTerm, searchType, resultCount, selectedSymbol = null, priceData = null) {
    try {
      const searchHistory = new SearchHistory({
        searchTerm,
        searchType,
        resultFound: resultCount > 0,
        resultCount,
        selectedSymbol,
        priceData,
        searchTime: new Date(),
      })

      return await searchHistory.save()
    } catch (error) {
      console.error("❌ Error logging search history:", error.message)
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10) {
    try {
      return await SearchHistory.aggregate([
        { $match: { resultFound: true } },
        { $group: { _id: "$searchTerm", count: { $sum: 1 }, lastSearched: { $max: "$searchTime" } } },
        { $sort: { count: -1, lastSearched: -1 } },
        { $limit: limit },
        { $project: { searchTerm: "$_id", count: 1, lastSearched: 1, _id: 0 } },
      ])
    } catch (error) {
      console.error("❌ Error getting popular searches:", error.message)
      throw error
    }
  }

  /**
   * Create or update watchlist
   */
  async createWatchList(name, symbols = [], userId = "default_user") {
    try {
      const watchList = new WatchList({
        name,
        symbols: symbols.map((symbol) => ({
          ...symbol,
          addedAt: new Date(),
        })),
        userId,
        lastAccessed: new Date(),
      })

      return await watchList.save()
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
      const watchList = await WatchList.findById(watchListId)
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
        addedAt: new Date(),
      })

      watchList.lastAccessed = new Date()
      return await watchList.save()
    } catch (error) {
      console.error("❌ Error adding to watchlist:", error.message)
      throw error
    }
  }

  /**
   * Get price history for symbol
   */
  async getPriceHistory(token, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      return await PriceHistory.find({
        token,
        timestamp: { $gte: startDate },
      })
        .sort({ timestamp: -1 })
        .limit(1000)
    } catch (error) {
      console.error("❌ Error getting price history:", error.message)
      throw error
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats() {
    try {
      const [symbolCount, searchCount, priceCount, watchListCount] = await Promise.all([
        StockSymbol.countDocuments({ isActive: true }),
        SearchHistory.countDocuments(),
        PriceHistory.countDocuments(),
        WatchList.countDocuments({ isActive: true }),
      ])

      const recentSearches = await SearchHistory.find().sort({ searchTime: -1 }).limit(5)

      const exchangeStats = await StockSymbol.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$exchange", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])

      return {
        collections: {
          symbols: symbolCount,
          searches: searchCount,
          priceHistory: priceCount,
          watchLists: watchListCount,
        },
        exchanges: exchangeStats,
        recentSearches: recentSearches.map((s) => ({
          term: s.searchTerm,
          found: s.resultFound,
          time: s.searchTime,
        })),
        lastSyncTime: this.lastSyncTime,
      }
    } catch (error) {
      console.error("❌ Error getting collection stats:", error.message)
      throw error
    }
  }

  /**
   * Export data to JSON
   */
  async exportToJson(collection, query = {}, limit = 1000) {
    try {
      let Model
      switch (collection) {
        case "symbols":
          Model = StockSymbol
          break
        case "searches":
          Model = SearchHistory
          break
        case "prices":
          Model = PriceHistory
          break
        case "watchlists":
          Model = WatchList
          break
        default:
          throw new Error("Invalid collection name")
      }

      const data = await Model.find(query).limit(limit).lean()
      return {
        collection,
        count: data.length,
        exportTime: new Date(),
        data,
      }
    } catch (error) {
      console.error("❌ Error exporting to JSON:", error.message)
      throw error
    }
  }
}

module.exports = new JsonCollectionService()
