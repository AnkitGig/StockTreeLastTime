const axios = require("axios")
const MarketData = require("../models/MarketData")
const { getTokensByExchange, getStockByToken } = require("../config/stockConfig")

class MarketDataService {
  constructor() {
    this.baseUrl = "https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/"
    this.lastFetchTime = null
    this.fetchCount = 0
  }

  async fetchMarketData(authToken, mode = "FULL") {
    try {
      if (!authToken) {
        throw new Error("Authentication token required")
      }

      const exchangeTokens = getTokensByExchange()

      const requestPayload = {
        mode: mode,
        exchangeTokens: exchangeTokens,
      }

      console.log(`📊 Fetching market data (${mode} mode)...`)

      const response = await axios.post(this.baseUrl, requestPayload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
      })

      if (response.data && response.data.status) {
        const processedData = await this.processMarketDataResponse(response.data)
        this.lastFetchTime = new Date()
        this.fetchCount++

        console.log(`✅ Market data fetched successfully (${processedData.length} records)`)

        return {
          success: true,
          data: processedData,
          fetchTime: this.lastFetchTime,
          fetchCount: this.fetchCount,
        }
      } else {
        throw new Error(`API Error: ${response.data?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error fetching market data:", error.message)
      throw error
    }
  }

  async processMarketDataResponse(apiResponse) {
    try {
      const { fetched, unfetched } = apiResponse.data
      const processedData = []

      console.log(`📊 Processing ${fetched.length} fetched records`)

      if (unfetched.length > 0) {
        console.log(`⚠️ ${unfetched.length} records were not fetched`)
      }

      for (const stockData of fetched) {
        const processedStock = await this.processStockData(stockData)
        if (processedStock) {
          processedData.push(processedStock)
        }
      }

      return processedData
    } catch (error) {
      console.error("❌ Error processing market data response:", error)
      throw error
    }
  }

  async processStockData(stockData) {
    try {
      const stockConfig = getStockByToken(stockData.symbolToken)

      if (!stockConfig) {
        console.log(`⚠️ Unknown token: ${stockData.symbolToken}`)
        return null
      }

      const processedData = {
        token: stockData.symbolToken,
        symbol: stockConfig.symbol,
        ltp: stockData.ltp || 0,
        change: stockData.netChange || 0,
        changePercent: stockData.percentChange || 0,
        open: stockData.open || 0,
        high: stockData.high || 0,
        low: stockData.low || 0,
        close: stockData.close || 0,
        volume: stockData.tradeVolume || 0,
        avgPrice: stockData.avgPrice || 0,
        upperCircuit: stockData.upperCircuit || 0,
        lowerCircuit: stockData.lowerCircuit || 0,
        weekHigh52: stockData["52WeekHigh"] || 0,
        weekLow52: stockData["52WeekLow"] || 0,
        timestamp: new Date(),
      }

      console.log(`📊 Processed ${stockConfig.symbol}: ₹${stockData.ltp}`)
      return processedData
    } catch (error) {
      console.error("❌ Error processing stock data:", error)
      return null
    }
  }

  async fetchLiveDataOnly(authToken, mode = "FULL") {
    try {
      if (!authToken) {
        throw new Error("Authentication token required")
      }

      const exchangeTokens = getTokensByExchange()

      const requestPayload = {
        mode: mode,
        exchangeTokens: exchangeTokens,
      }

      console.log(`📊 Fetching live market data (${mode} mode) - No DB save...`)

      const response = await axios.post(this.baseUrl, requestPayload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
      })

      if (response.data && response.data.status) {
        const processedData = await this.processLiveDataOnly(response.data)
        this.lastFetchTime = new Date()
        this.fetchCount++

        console.log(`✅ Live data fetched successfully (${processedData.length} records) - No DB save`)

        return {
          success: true,
          data: processedData,
          fetchTime: this.lastFetchTime,
          fetchCount: this.fetchCount,
        }
      } else {
        throw new Error(`API Error: ${response.data?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error fetching live market data:", error.message)
      throw error
    }
  }

  async processLiveDataOnly(apiResponse) {
    try {
      const { fetched, unfetched } = apiResponse.data
      const processedData = []

      console.log(`📊 Processing ${fetched.length} fetched records (Live only - No DB save)`)

      if (unfetched.length > 0) {
        console.log(`⚠️ ${unfetched.length} unfetched records`)
      }

      for (const stockData of fetched) {
        const stockConfig = getStockByToken(stockData.symbolToken)

        if (!stockConfig) {
          console.log(`⚠️ Unknown token: ${stockData.symbolToken}`)
          continue
        }

        const liveData = {
          token: stockData.symbolToken,
          symbol: stockConfig.symbol,
          ltp: stockData.ltp || 0,
          change: stockData.netChange || 0,
          changePercent: stockData.percentChange || 0,
          open: stockData.open || 0,
          high: stockData.high || 0,
          low: stockData.low || 0,
          close: stockData.close || 0,
          volume: stockData.tradeVolume || 0,
          avgPrice: stockData.avgPrice || 0,
          upperCircuit: stockData.upperCircuit || 0,
          lowerCircuit: stockData.lowerCircuit || 0,
          weekHigh52: stockData["52WeekHigh"] || 0,
          weekLow52: stockData["52WeekLow"] || 0,
          timestamp: new Date(),
        }

        processedData.push(liveData)
        console.log(`📊 Live ${stockConfig.symbol}: ₹${stockData.ltp}`)
      }

      return processedData
    } catch (error) {
      console.error("❌ Error processing live data response:", error)
      throw error
    }
  }

  async saveMarketData(stockData) {
    // Database saving disabled for live streaming
    console.log(`🚫 Database saving disabled for live data`)
    return null
  }

  async getLatestMarketData() {
    try {
      const latestData = await MarketData.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$symbol",
            latestData: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$latestData" } },
        { $sort: { symbol: 1 } },
      ])

      return latestData
    } catch (error) {
      console.error("❌ Error getting latest market data:", error)
      throw error
    }
  }

  async getMarketDataBySymbol(symbol, limit = 100) {
    try {
      const data = await MarketData.find({ symbol }).sort({ timestamp: -1 }).limit(limit)

      return data
    } catch (error) {
      console.error("❌ Error getting market data by symbol:", error)
      throw error
    }
  }

  getStats() {
    return {
      lastFetchTime: this.lastFetchTime,
      fetchCount: this.fetchCount,
    }
  }
}

module.exports = new MarketDataService()
