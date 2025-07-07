const cron = require("node-cron")
const authService = require("./authService")
const marketDataService = require("./marketDataService")
const { websocketService } = require("./websocketService")

class SchedulerService {
  constructor() {
    this.marketDataTask = null
    this.authCheckTask = null
    this.isMarketDataRunning = false
  }

  startMarketDataScheduler() {
    // Fetch market data every 30 seconds during market hours
    this.marketDataTask = cron.schedule(
      "*/30 * * * * *",
      async () => {
        await this.fetchAndBroadcastMarketData()
      },
      {
        scheduled: false,
      },
    )

    // Check authentication every 5 minutes
    this.authCheckTask = cron.schedule(
      "*/5 * * * *",
      async () => {
        await this.checkAuthentication()
      },
      {
        scheduled: false,
      },
    )

    // Start tasks
    this.marketDataTask.start()
    this.authCheckTask.start()

    console.log("⏰ Market data scheduler started")
    console.log("   📊 Market data: Every 30 seconds")
    console.log("   🔐 Auth check: Every 5 minutes")

    // Initial authentication and data fetch
    setTimeout(() => {
      this.initializeServices()
    }, 2000)
  }

  async initializeServices() {
    try {
      console.log("🚀 Initializing services...")

      // Authenticate first
      await authService.login()

      // Fetch initial market data
      await this.fetchAndBroadcastMarketData()

      console.log("✅ Services initialized successfully")
    } catch (error) {
      console.error("❌ Error initializing services:", error.message)
    }
  }

  async fetchAndBroadcastMarketData() {
    if (this.isMarketDataRunning) {
      console.log("⏳ Market data fetch already in progress, skipping...")
      return
    }

    try {
      this.isMarketDataRunning = true

      if (!authService.isAuthenticated()) {
        console.log("🔐 Not authenticated, attempting login...")
        await authService.login()
      }

      const authToken = authService.getAuthToken()

      // Fetch data without saving to database
      const result = await this.fetchMarketDataForBroadcast(authToken)

      if (result.success && result.data.length > 0) {
        // Only broadcast to WebSocket clients
        websocketService.broadcastMarketData(result.data)
        console.log(`📡 Broadcasted ${result.data.length} live updates (No DB save)`)
      }
    } catch (error) {
      console.error("❌ Error in market data scheduler:", error.message)

      // If authentication error, try to re-authenticate
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        console.log("🔐 Authentication expired, attempting re-login...")
        try {
          await authService.login()
        } catch (authError) {
          console.error("❌ Re-authentication failed:", authError.message)
        }
      }
    } finally {
      this.isMarketDataRunning = false
    }
  }

  async fetchMarketDataForBroadcast(authToken) {
    try {
      const exchangeTokens = require("../config/stockConfig").getTokensByExchange()

      const requestPayload = {
        mode: "FULL",
        exchangeTokens: exchangeTokens,
      }

      console.log(`📊 Fetching live data for broadcast only...`)

      const axios = require("axios")
      const response = await axios.post(
        "https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/",
        requestPayload,
        {
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
        },
      )

      if (response.data && response.data.status) {
        const processedData = this.processLiveDataForBroadcast(response.data)

        return {
          success: true,
          data: processedData,
          fetchTime: new Date(),
        }
      } else {
        throw new Error(`API Error: ${response.data?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error fetching live data:", error.message)
      throw error
    }
  }

  processLiveDataForBroadcast(apiResponse) {
    try {
      const { fetched, unfetched } = apiResponse.data
      const processedData = []
      const { getStockByToken } = require("../config/stockConfig")

      console.log(`📊 Processing ${fetched.length} live records for broadcast`)

      if (unfetched.length > 0) {
        console.log(`⚠️ ${unfetched.length} records were not fetched`)
      }

      for (const stockData of fetched) {
        const stockConfig = getStockByToken(stockData.symbolToken)

        if (stockConfig) {
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
          console.log(`📊 ${stockConfig.symbol}: ₹${stockData.ltp}`)
        }
      }

      return processedData
    } catch (error) {
      console.error("❌ Error processing live data:", error)
      return []
    }
  }

  async checkAuthentication() {
    try {
      if (!authService.isAuthenticated()) {
        console.log("🔐 Authentication check: Not authenticated, attempting login...")
        await authService.login()
      } else {
        const loginTime = authService.getLoginTime()
        const timeSinceLogin = Date.now() - loginTime.getTime()
        const hoursElapsed = timeSinceLogin / (1000 * 60 * 60)

        console.log(`🔐 Authentication check: Active (${hoursElapsed.toFixed(1)}h since login)`)

        // Re-authenticate if more than 8 hours
        if (hoursElapsed > 8) {
          console.log("🔐 Token expired, re-authenticating...")
          await authService.login()
        }
      }
    } catch (error) {
      console.error("❌ Error in authentication check:", error.message)
    }
  }

  stopScheduler() {
    if (this.marketDataTask) {
      this.marketDataTask.stop()
      console.log("⏹️ Market data scheduler stopped")
    }

    if (this.authCheckTask) {
      this.authCheckTask.stop()
      console.log("⏹️ Authentication scheduler stopped")
    }
  }

  getStatus() {
    return {
      marketDataRunning: this.marketDataTask ? this.marketDataTask.running : false,
      authCheckRunning: this.authCheckTask ? this.authCheckTask.running : false,
      isMarketDataFetching: this.isMarketDataRunning,
    }
  }
}

const schedulerService = new SchedulerService()

const startMarketDataScheduler = () => {
  schedulerService.startMarketDataScheduler()
}

module.exports = {
  schedulerService,
  startMarketDataScheduler,
}
