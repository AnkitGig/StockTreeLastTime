const jsonFileService = require("./jsonFileService")
const authService = require("./authService")
const axios = require("axios")

class PriceAnalyticsService {
  constructor() {
    this.baseUrl = "https://apiconnect.angelone.in/rest/secure/angelbroking"
    this.cache = new Map()
    this.cacheTimeout = 60000 // 1 minute cache
  }

  /**
   * Get live price with comprehensive analytics
   */
  async getLivePriceWithAnalytics(token, symbol, exchange) {
    try {
      const cacheKey = `${token}_${Date.now() - (Date.now() % this.cacheTimeout)}`

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      const authToken = authService.getAuthToken()
      if (!authToken) {
        throw new Error("Authentication required")
      }

      // Get current price
      const currentPrice = await this.getCurrentPrice(authToken, token, symbol, exchange)

      // Get historical data for analytics
      const historicalData = await this.getHistoricalData(authToken, token, symbol, exchange)

      // Calculate analytics
      const analytics = await this.calculatePriceAnalytics(token, currentPrice, historicalData)

      const result = {
        symbol,
        token,
        exchange,
        currentPrice,
        analytics,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date(),
      }

      // Cache the result
      this.cache.set(cacheKey, result)

      // Save to price history
      await this.savePriceData(token, symbol, exchange, currentPrice, analytics)

      return result
    } catch (error) {
      console.error("❌ Error getting live price with analytics:", error.message)
      throw error
    }
  }

  /**
   * Get current live price
   */
  async getCurrentPrice(authToken, token, symbol, exchange) {
    try {
      const requestPayload = {
        mode: "FULL",
        exchangeTokens: {
          [exchange]: [token],
        },
      }

      const response = await axios.post(`${this.baseUrl}/market/v1/quote/`, requestPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
      })

      if (response.data && response.data.status && response.data.data.fetched.length > 0) {
        const stockData = response.data.data.fetched[0]

        return {
          ltp: Number.parseFloat(stockData.ltp) || 0,
          open: Number.parseFloat(stockData.open) || 0,
          high: Number.parseFloat(stockData.high) || 0,
          low: Number.parseFloat(stockData.low) || 0,
          close: Number.parseFloat(stockData.close) || 0,
          volume: Number.parseInt(stockData.tradeVolume) || 0,
          change: Number.parseFloat(stockData.netChange) || 0,
          changePercent: Number.parseFloat(stockData.percentChange) || 0,
          avgPrice: Number.parseFloat(stockData.avgPrice) || 0,
          upperCircuit: Number.parseFloat(stockData.upperCircuit) || 0,
          lowerCircuit: Number.parseFloat(stockData.lowerCircuit) || 0,
          weekHigh52: Number.parseFloat(stockData["52WeekHigh"]) || 0,
          weekLow52: Number.parseFloat(stockData["52WeekLow"]) || 0,
          totalBuyQuantity: Number.parseInt(stockData.totalBuyQuantity) || 0,
          totalSellQuantity: Number.parseInt(stockData.totalSellQuantity) || 0,
          lastTradeTime: stockData.lastTradeTime || new Date().toISOString(),
        }
      } else {
        throw new Error("No price data received from API")
      }
    } catch (error) {
      console.error("❌ Error fetching current price:", error.message)
      throw error
    }
  }

  /**
   * Get historical data for analytics
   */
  async getHistoricalData(authToken, token, symbol, exchange) {
    try {
      // Try to get historical data from Angel Broking API
      // Note: This is a placeholder - Angel Broking may have different endpoints for historical data

      // For now, get data from our stored price history
      const storedHistory = await jsonFileService.getPriceHistory(token, 365) // Last year

      return storedHistory.map((record) => ({
        date: record.timestamp,
        open: record.priceData.open,
        high: record.priceData.high,
        low: record.priceData.low,
        close: record.priceData.ltp,
        volume: record.priceData.volume,
      }))
    } catch (error) {
      console.warn("⚠️ Could not fetch historical data:", error.message)
      return []
    }
  }

  /**
   * Calculate comprehensive price analytics
   */
  async calculatePriceAnalytics(token, currentPrice, historicalData) {
    try {
      const now = new Date()
      const analytics = {
        today: this.calculateTodayAnalytics(currentPrice),
        week: this.calculateWeekAnalytics(historicalData, 7),
        month: this.calculateMonthAnalytics(historicalData, 30),
        quarter: this.calculateQuarterAnalytics(historicalData, 90),
        year: this.calculateYearAnalytics(historicalData, 365),
        week52: {
          high: currentPrice.weekHigh52,
          low: currentPrice.weekLow52,
          currentVsHigh:
            currentPrice.weekHigh52 > 0
              ? (((currentPrice.ltp - currentPrice.weekHigh52) / currentPrice.weekHigh52) * 100).toFixed(2)
              : 0,
          currentVsLow:
            currentPrice.weekLow52 > 0
              ? (((currentPrice.ltp - currentPrice.weekLow52) / currentPrice.weekLow52) * 100).toFixed(2)
              : 0,
        },
        technicalIndicators: this.calculateTechnicalIndicators(historicalData),
        volatility: this.calculateVolatility(historicalData),
        support: this.calculateSupportLevels(historicalData),
        resistance: this.calculateResistanceLevels(historicalData),
      }

      return analytics
    } catch (error) {
      console.error("❌ Error calculating analytics:", error.message)
      return this.getDefaultAnalytics(currentPrice)
    }
  }

  /**
   * Calculate today's analytics
   */
  calculateTodayAnalytics(currentPrice) {
    return {
      open: currentPrice.open,
      high: currentPrice.high,
      low: currentPrice.low,
      ltp: currentPrice.ltp,
      close: currentPrice.close,
      change: currentPrice.change,
      changePercent: currentPrice.changePercent,
      volume: currentPrice.volume,
      avgPrice: currentPrice.avgPrice,
      upperCircuit: currentPrice.upperCircuit,
      lowerCircuit: currentPrice.lowerCircuit,
      dayRange: `₹${currentPrice.low} - ₹${currentPrice.high}`,
      dayRangePercent:
        currentPrice.high > 0 ? (((currentPrice.high - currentPrice.low) / currentPrice.low) * 100).toFixed(2) : 0,
    }
  }

  /**
   * Calculate weekly analytics
   */
  calculateWeekAnalytics(historicalData, days) {
    const weekData = this.getDataForPeriod(historicalData, days)
    if (weekData.length === 0) return this.getEmptyPeriodAnalytics("week")

    const high = Math.max(...weekData.map((d) => d.high))
    const low = Math.min(...weekData.map((d) => d.low))
    const firstPrice = weekData[weekData.length - 1]?.close || 0
    const lastPrice = weekData[0]?.close || 0
    const change = lastPrice - firstPrice
    const changePercent = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(2) : 0

    return {
      high,
      low,
      change,
      changePercent,
      range: `₹${low} - ₹${high}`,
      rangePercent: low > 0 ? (((high - low) / low) * 100).toFixed(2) : 0,
      avgVolume: this.calculateAverageVolume(weekData),
    }
  }

  /**
   * Calculate monthly analytics
   */
  calculateMonthAnalytics(historicalData, days) {
    const monthData = this.getDataForPeriod(historicalData, days)
    if (monthData.length === 0) return this.getEmptyPeriodAnalytics("month")

    const high = Math.max(...monthData.map((d) => d.high))
    const low = Math.min(...monthData.map((d) => d.low))
    const firstPrice = monthData[monthData.length - 1]?.close || 0
    const lastPrice = monthData[0]?.close || 0
    const change = lastPrice - firstPrice
    const changePercent = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(2) : 0

    return {
      high,
      low,
      change,
      changePercent,
      range: `₹${low} - ₹${high}`,
      rangePercent: low > 0 ? (((high - low) / low) * 100).toFixed(2) : 0,
      avgVolume: this.calculateAverageVolume(monthData),
      trend: this.calculateTrend(monthData),
    }
  }

  /**
   * Calculate quarterly analytics
   */
  calculateQuarterAnalytics(historicalData, days) {
    const quarterData = this.getDataForPeriod(historicalData, days)
    if (quarterData.length === 0) return this.getEmptyPeriodAnalytics("quarter")

    const high = Math.max(...quarterData.map((d) => d.high))
    const low = Math.min(...quarterData.map((d) => d.low))
    const firstPrice = quarterData[quarterData.length - 1]?.close || 0
    const lastPrice = quarterData[0]?.close || 0
    const change = lastPrice - firstPrice
    const changePercent = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(2) : 0

    return {
      high,
      low,
      change,
      changePercent,
      range: `₹${low} - ₹${high}`,
      rangePercent: low > 0 ? (((high - low) / low) * 100).toFixed(2) : 0,
      avgVolume: this.calculateAverageVolume(quarterData),
      trend: this.calculateTrend(quarterData),
    }
  }

  /**
   * Calculate yearly analytics
   */
  calculateYearAnalytics(historicalData, days) {
    const yearData = this.getDataForPeriod(historicalData, days)
    if (yearData.length === 0) return this.getEmptyPeriodAnalytics("year")

    const high = Math.max(...yearData.map((d) => d.high))
    const low = Math.min(...yearData.map((d) => d.low))
    const firstPrice = yearData[yearData.length - 1]?.close || 0
    const lastPrice = yearData[0]?.close || 0
    const change = lastPrice - firstPrice
    const changePercent = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(2) : 0

    return {
      high,
      low,
      change,
      changePercent,
      range: `₹${low} - ₹${high}`,
      rangePercent: low > 0 ? (((high - low) / low) * 100).toFixed(2) : 0,
      avgVolume: this.calculateAverageVolume(yearData),
      trend: this.calculateTrend(yearData),
      volatility: this.calculateVolatility(yearData),
    }
  }

  /**
   * Calculate technical indicators
   */
  calculateTechnicalIndicators(historicalData) {
    if (historicalData.length < 20) {
      return {
        sma20: 0,
        sma50: 0,
        ema12: 0,
        ema26: 0,
        rsi: 0,
        macd: 0,
      }
    }

    const prices = historicalData.map((d) => d.close).slice(0, 50)

    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      ema12: this.calculateEMA(prices, 12),
      ema26: this.calculateEMA(prices, 26),
      rsi: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
    }
  }

  /**
   * Helper methods
   */
  getDataForPeriod(historicalData, days) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return historicalData.filter((d) => new Date(d.date) >= cutoffDate)
  }

  getEmptyPeriodAnalytics(period) {
    return {
      high: 0,
      low: 0,
      change: 0,
      changePercent: 0,
      range: "₹0 - ₹0",
      rangePercent: 0,
      avgVolume: 0,
      trend: "neutral",
    }
  }

  calculateAverageVolume(data) {
    if (data.length === 0) return 0
    const totalVolume = data.reduce((sum, d) => sum + (d.volume || 0), 0)
    return Math.round(totalVolume / data.length)
  }

  calculateTrend(data) {
    if (data.length < 2) return "neutral"

    const firstPrice = data[data.length - 1]?.close || 0
    const lastPrice = data[0]?.close || 0

    if (lastPrice > firstPrice * 1.02) return "bullish"
    if (lastPrice < firstPrice * 0.98) return "bearish"
    return "neutral"
  }

  calculateVolatility(data) {
    if (data.length < 2) return 0

    const returns = []
    for (let i = 1; i < data.length; i++) {
      const currentPrice = data[i - 1].close
      const previousPrice = data[i].close
      if (previousPrice > 0) {
        returns.push((currentPrice - previousPrice) / previousPrice)
      }
    }

    if (returns.length === 0) return 0

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length

    return (Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2) // Annualized volatility
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return 0
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0)
    return (sum / period).toFixed(2)
  }

  calculateEMA(prices, period) {
    if (prices.length < period) return 0

    const multiplier = 2 / (period + 1)
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period

    for (let i = period; i < Math.min(prices.length, period + 10); i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier)
    }

    return ema.toFixed(2)
  }

  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50

    let gains = 0
    let losses = 0

    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i]
      if (change > 0) gains += change
      else losses -= change
    }

    const avgGain = gains / period
    const avgLoss = losses / period

    if (avgLoss === 0) return 100

    const rs = avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    return rsi.toFixed(2)
  }

  calculateMACD(prices) {
    const ema12 = Number.parseFloat(this.calculateEMA(prices, 12))
    const ema26 = Number.parseFloat(this.calculateEMA(prices, 26))
    return (ema12 - ema26).toFixed(2)
  }

  calculateSupportLevels(historicalData) {
    if (historicalData.length < 10) return []

    const lows = historicalData.map((d) => d.low).sort((a, b) => a - b)
    const supports = []

    // Find significant low levels
    for (let i = 0; i < Math.min(3, lows.length); i++) {
      if (lows[i] > 0) {
        supports.push(lows[i].toFixed(2))
      }
    }

    return supports
  }

  calculateResistanceLevels(historicalData) {
    if (historicalData.length < 10) return []

    const highs = historicalData.map((d) => d.high).sort((a, b) => b - a)
    const resistances = []

    // Find significant high levels
    for (let i = 0; i < Math.min(3, highs.length); i++) {
      if (highs[i] > 0) {
        resistances.push(highs[i].toFixed(2))
      }
    }

    return resistances
  }

  getDefaultAnalytics(currentPrice) {
    return {
      today: this.calculateTodayAnalytics(currentPrice),
      week: this.getEmptyPeriodAnalytics("week"),
      month: this.getEmptyPeriodAnalytics("month"),
      quarter: this.getEmptyPeriodAnalytics("quarter"),
      year: this.getEmptyPeriodAnalytics("year"),
      week52: {
        high: currentPrice.weekHigh52,
        low: currentPrice.weekLow52,
        currentVsHigh: 0,
        currentVsLow: 0,
      },
      technicalIndicators: {
        sma20: 0,
        sma50: 0,
        ema12: 0,
        ema26: 0,
        rsi: 50,
        macd: 0,
      },
      volatility: 0,
      support: [],
      resistance: [],
    }
  }

  /**
   * Save price data with analytics
   */
  async savePriceData(token, symbol, exchange, priceData, analytics) {
    try {
      await jsonFileService.savePriceData(token, symbol, exchange, priceData, {
        sma20: analytics.technicalIndicators?.sma20 || 0,
        sma50: analytics.technicalIndicators?.sma50 || 0,
        ema12: analytics.technicalIndicators?.ema12 || 0,
        ema26: analytics.technicalIndicators?.ema26 || 0,
        rsi: analytics.technicalIndicators?.rsi || 0,
        macd: analytics.technicalIndicators?.macd || 0,
        volatility: analytics.volatility || 0,
      })
    } catch (error) {
      console.warn("⚠️ Could not save price data:", error.message)
    }
  }

  /**
   * Get price analytics for multiple stocks
   */
  async getBulkPriceAnalytics(tokens) {
    const results = []

    for (const tokenInfo of tokens) {
      try {
        const analytics = await this.getLivePriceWithAnalytics(tokenInfo.token, tokenInfo.symbol, tokenInfo.exchange)
        results.push(analytics)
      } catch (error) {
        console.error(`❌ Error getting analytics for ${tokenInfo.symbol}:`, error.message)
        results.push({
          symbol: tokenInfo.symbol,
          token: tokenInfo.token,
          exchange: tokenInfo.exchange,
          error: error.message,
        })
      }
    }

    return results
  }
}

module.exports = new PriceAnalyticsService()
