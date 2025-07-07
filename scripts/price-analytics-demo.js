const priceAnalyticsService = require("../src/services/priceAnalyticsService")
const authService = require("../src/services/authService")
const jsonFileService = require("../src/services/jsonFileService")
const Table = require("cli-table3")

class PriceAnalyticsDemo {
  constructor() {
    this.popularStocks = [
      { symbol: "RELIANCE", token: "3045", exchange: "NSE" },
      { symbol: "TCS", token: "2885", exchange: "NSE" },
      { symbol: "HDFCBANK", token: "1333", exchange: "NSE" },
      { symbol: "INFY", token: "99926004", exchange: "NSE" },
      { symbol: "ICICIBANK", token: "1594", exchange: "NSE" },
      { symbol: "SBIN", token: "3045", exchange: "NSE" },
      { symbol: "ITC", token: "17963", exchange: "NSE" },
      { symbol: "LT", token: "11536", exchange: "NSE" },
      { symbol: "KOTAKBANK", token: "1660", exchange: "NSE" },
      { symbol: "BHARTIARTL", token: "10999", exchange: "NSE" },
    ]
  }

  /**
   * Demo single stock analytics
   */
  async demoSingleStock(symbol = "RELIANCE") {
    try {
      console.log(`\n🔍 Analyzing ${symbol}...`)
      console.log("=".repeat(60))

      // Authenticate first
      if (!authService.isAuthenticated()) {
        console.log("🔐 Authenticating...")
        await authService.login()
      }

      // Search for the stock
      const results = await jsonFileService.searchSymbols(symbol, 1)
      if (results.length === 0) {
        console.log(`❌ Stock ${symbol} not found`)
        return
      }

      const stock = results[0]
      console.log(`✅ Found: ${stock.symbol} - ${stock.name}`)

      // Get comprehensive analytics
      const analytics = await priceAnalyticsService.getLivePriceWithAnalytics(stock.token, stock.symbol, stock.exchange)

      this.displaySingleStockAnalytics(analytics)
    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error.message)
    }
  }

  /**
   * Display single stock analytics
   */
  displaySingleStockAnalytics(data) {
    console.log(`\n📊 ${data.symbol} - Live Price Analytics`)
    console.log("=".repeat(60))

    // Current Price Table
    const priceTable = new Table({
      head: ["Metric", "Value", "Change"],
      style: { head: ["cyan", "bold"] },
    })

    const changeSymbol = data.currentPrice.change >= 0 ? "+" : ""
    const changeColor = data.currentPrice.change >= 0 ? "🟢" : "🔴"

    priceTable.push(
      [
        "Current Price",
        `₹${data.currentPrice.ltp.toFixed(2)}`,
        `${changeColor} ${changeSymbol}₹${data.currentPrice.change.toFixed(2)}`,
      ],
      ["Change %", `${changeSymbol}${data.currentPrice.changePercent.toFixed(2)}%`, ""],
      ["Open", `₹${data.currentPrice.open.toFixed(2)}`, ""],
      ["Day High", `₹${data.currentPrice.high.toFixed(2)}`, ""],
      ["Day Low", `₹${data.currentPrice.low.toFixed(2)}`, ""],
      ["Volume", data.currentPrice.volume.toLocaleString(), ""],
      ["Avg Price", `₹${data.currentPrice.avgPrice.toFixed(2)}`, ""],
    )

    console.log(priceTable.toString())

    // 52-Week Analysis
    console.log("\n📈 52-Week Analysis:")
    const weekTable = new Table({
      head: ["Metric", "Value", "Current vs Level"],
      style: { head: ["yellow", "bold"] },
    })

    weekTable.push(
      ["52W High", `₹${data.analytics.week52.high.toFixed(2)}`, `${data.analytics.week52.currentVsHigh}%`],
      ["52W Low", `₹${data.analytics.week52.low.toFixed(2)}`, `${data.analytics.week52.currentVsLow}%`],
    )

    console.log(weekTable.toString())

    // Period Analysis
    console.log("\n📊 Period Analysis:")
    const periodTable = new Table({
      head: ["Period", "High", "Low", "Range", "Trend"],
      style: { head: ["green", "bold"] },
    })

    periodTable.push(
      [
        "Week",
        `₹${data.analytics.week.high.toFixed(2)}`,
        `₹${data.analytics.week.low.toFixed(2)}`,
        data.analytics.week.range,
        this.getTrendEmoji(data.analytics.week.trend || "neutral"),
      ],
      [
        "Month",
        `₹${data.analytics.month.high.toFixed(2)}`,
        `₹${data.analytics.month.low.toFixed(2)}`,
        data.analytics.month.range,
        this.getTrendEmoji(data.analytics.month.trend),
      ],
      [
        "Quarter",
        `₹${data.analytics.quarter.high.toFixed(2)}`,
        `₹${data.analytics.quarter.low.toFixed(2)}`,
        data.analytics.quarter.range,
        this.getTrendEmoji(data.analytics.quarter.trend),
      ],
    )

    console.log(periodTable.toString())

    // Technical Indicators
    console.log("\n🔧 Technical Indicators:")
    const techTable = new Table({
      head: ["Indicator", "Value", "Signal"],
      style: { head: ["magenta", "bold"] },
    })

    const currentPrice = data.currentPrice.ltp
    const sma20 = Number.parseFloat(data.analytics.technicalIndicators.sma20)
    const rsi = Number.parseFloat(data.analytics.technicalIndicators.rsi)

    techTable.push(
      ["SMA 20", data.analytics.technicalIndicators.sma20, this.getPriceSignal(currentPrice, sma20)],
      ["SMA 50", data.analytics.technicalIndicators.sma50, ""],
      ["EMA 12", data.analytics.technicalIndicators.ema12, ""],
      ["EMA 26", data.analytics.technicalIndicators.ema26, ""],
      ["RSI", data.analytics.technicalIndicators.rsi, this.getRSISignal(rsi)],
      ["MACD", data.analytics.technicalIndicators.macd, ""],
    )

    console.log(techTable.toString())

    // Summary
    console.log("\n📋 Summary:")
    console.log(
      `   💰 Current: ₹${data.currentPrice.ltp.toFixed(2)} (${changeSymbol}${data.currentPrice.changePercent.toFixed(2)}%)`,
    )
    console.log(`   📈 Day Range: ₹${data.currentPrice.low.toFixed(2)} - ₹${data.currentPrice.high.toFixed(2)}`)
    console.log(`   📊 52W Range: ₹${data.analytics.week52.low.toFixed(2)} - ₹${data.analytics.week52.high.toFixed(2)}`)
    console.log(`   🔄 Volume: ${data.currentPrice.volume.toLocaleString()}`)
    console.log(`   ⏰ Last Updated: ${new Date(data.timestamp).toLocaleString()}`)
  }

  /**
   * Demo bulk analytics for popular stocks
   */
  async demoBulkAnalytics() {
    try {
      console.log("\n🚀 Bulk Analytics Demo - Popular Stocks")
      console.log("=".repeat(60))

      // Authenticate first
      if (!authService.isAuthenticated()) {
        console.log("🔐 Authenticating...")
        await authService.login()
      }

      console.log("📊 Fetching analytics for popular stocks...")

      const results = []
      for (const stock of this.popularStocks.slice(0, 5)) {
        // Limit to 5 for demo
        try {
          console.log(`   📈 Analyzing ${stock.symbol}...`)
          const analytics = await priceAnalyticsService.getLivePriceWithAnalytics(
            stock.token,
            stock.symbol,
            stock.exchange,
          )
          results.push(analytics)
        } catch (error) {
          console.log(`   ❌ Error with ${stock.symbol}: ${error.message}`)
        }
      }

      this.displayBulkAnalytics(results)
    } catch (error) {
      console.error("❌ Error in bulk analytics demo:", error.message)
    }
  }

  /**
   * Display bulk analytics
   */
  displayBulkAnalytics(results) {
    console.log("\n📊 Bulk Analytics Results")
    console.log("=".repeat(80))

    const bulkTable = new Table({
      head: ["Symbol", "Price", "Change", "Change%", "Volume", "52W High", "52W Low", "RSI"],
      colWidths: [10, 10, 10, 10, 12, 10, 10, 8],
      style: { head: ["cyan", "bold"] },
    })

    results.forEach((data) => {
      if (data.currentPrice) {
        const changeSymbol = data.currentPrice.change >= 0 ? "+" : ""
        bulkTable.push([
          data.symbol,
          `₹${data.currentPrice.ltp.toFixed(2)}`,
          `${changeSymbol}₹${data.currentPrice.change.toFixed(2)}`,
          `${changeSymbol}${data.currentPrice.changePercent.toFixed(2)}%`,
          data.currentPrice.volume.toLocaleString(),
          `₹${data.analytics.week52.high.toFixed(2)}`,
          `₹${data.analytics.week52.low.toFixed(2)}`,
          data.analytics.technicalIndicators.rsi,
        ])
      }
    })

    console.log(bulkTable.toString())

    // Top performers
    const gainers = results
      .filter((d) => d.currentPrice && d.currentPrice.changePercent > 0)
      .sort((a, b) => b.currentPrice.changePercent - a.currentPrice.changePercent)

    const losers = results
      .filter((d) => d.currentPrice && d.currentPrice.changePercent < 0)
      .sort((a, b) => a.currentPrice.changePercent - b.currentPrice.changePercent)

    console.log("\n🏆 Top Performers:")
    if (gainers.length > 0) {
      console.log(`   📈 Best Gainer: ${gainers[0].symbol} (+${gainers[0].currentPrice.changePercent.toFixed(2)}%)`)
    }
    if (losers.length > 0) {
      console.log(`   📉 Biggest Loser: ${losers[0].symbol} (${losers[0].currentPrice.changePercent.toFixed(2)}%)`)
    }
  }

  /**
   * Demo price history analysis
   */
  async demoPriceHistory(symbol = "RELIANCE", days = 30) {
    try {
      console.log(`\n📈 Price History Demo - ${symbol} (${days} days)`)
      console.log("=".repeat(60))

      // Find stock
      const results = await jsonFileService.searchSymbols(symbol, 1)
      if (results.length === 0) {
        console.log(`❌ Stock ${symbol} not found`)
        return
      }

      const stock = results[0]
      const history = await jsonFileService.getPriceHistory(stock.token, days)

      if (history.length === 0) {
        console.log("❌ No price history found")
        return
      }

      console.log(`📊 Found ${history.length} price records`)

      // Calculate statistics
      const prices = history.map((h) => h.priceData.ltp)
      const volumes = history.map((h) => h.priceData.volume)

      const stats = {
        highest: Math.max(...prices),
        lowest: Math.min(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        volatility: this.calculateVolatility(prices),
      }

      const historyTable = new Table({
        head: ["Metric", "Value"],
        style: { head: ["blue", "bold"] },
      })

      historyTable.push(
        ["Period", `${days} days`],
        ["Records", history.length.toString()],
        ["Highest", `₹${stats.highest.toFixed(2)}`],
        ["Lowest", `₹${stats.lowest.toFixed(2)}`],
        ["Average", `₹${stats.average.toFixed(2)}`],
        ["Avg Volume", stats.avgVolume.toLocaleString()],
        ["Volatility", `${stats.volatility.toFixed(2)}%`],
      )

      console.log(historyTable.toString())

      // Recent prices
      console.log("\n📅 Recent Prices (Last 5 days):")
      const recentTable = new Table({
        head: ["Date", "Price", "Volume", "Change"],
        style: { head: ["green", "bold"] },
      })

      history.slice(0, 5).forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleDateString()
        const price = `₹${record.priceData.ltp.toFixed(2)}`
        const volume = record.priceData.volume.toLocaleString()

        let change = ""
        if (index < history.length - 1) {
          const prevPrice = history[index + 1].priceData.ltp
          const changeVal = record.priceData.ltp - prevPrice
          const changePercent = (changeVal / prevPrice) * 100
          const changeSymbol = changeVal >= 0 ? "+" : ""
          change = `${changeSymbol}${changePercent.toFixed(2)}%`
        }

        recentTable.push([date, price, volume, change])
      })

      console.log(recentTable.toString())
    } catch (error) {
      console.error("❌ Error in price history demo:", error.message)
    }
  }

  /**
   * Interactive demo mode
   */
  async interactiveDemo() {
    const readline = require("readline")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log("\n🚀 Price Analytics Interactive Demo")
    console.log("=".repeat(50))
    console.log("Available commands:")
    console.log("  1. single <SYMBOL>     - Single stock analysis")
    console.log("  2. bulk               - Bulk analysis of popular stocks")
    console.log("  3. history <SYMBOL>   - Price history analysis")
    console.log("  4. help               - Show this help")
    console.log("  5. exit               - Exit demo")

    const askCommand = () => {
      rl.question("\n📊 Enter command: ", async (input) => {
        const [command, ...args] = input.trim().split(" ")

        try {
          switch (command.toLowerCase()) {
            case "single":
              const symbol = args[0] || "RELIANCE"
              await this.demoSingleStock(symbol)
              break

            case "bulk":
              await this.demoBulkAnalytics()
              break

            case "history":
              const histSymbol = args[0] || "RELIANCE"
              const days = Number.parseInt(args[1]) || 30
              await this.demoPriceHistory(histSymbol, days)
              break

            case "help":
              console.log("\n📖 Available commands:")
              console.log("  single RELIANCE       - Analyze RELIANCE stock")
              console.log("  bulk                  - Analyze multiple stocks")
              console.log("  history TCS 60        - 60-day history for TCS")
              console.log("  exit                  - Exit demo")
              break

            case "exit":
              console.log("👋 Goodbye!")
              rl.close()
              return

            default:
              console.log(`❌ Unknown command: ${command}. Type 'help' for available commands.`)
          }
        } catch (error) {
          console.error("❌ Error executing command:", error.message)
        }

        askCommand()
      })
    }

    // Initialize
    try {
      await authService.login()
      console.log("✅ Authentication successful")
      askCommand()
    } catch (error) {
      console.error("❌ Authentication failed:", error.message)
      rl.close()
    }
  }

  /**
   * Helper methods
   */
  getTrendEmoji(trend) {
    switch (trend) {
      case "bullish":
        return "🟢 Bullish"
      case "bearish":
        return "🔴 Bearish"
      default:
        return "🟡 Neutral"
    }
  }

  getPriceSignal(currentPrice, smaPrice) {
    if (smaPrice === 0) return ""
    if (currentPrice > smaPrice) return "🟢 Above"
    if (currentPrice < smaPrice) return "🔴 Below"
    return "🟡 At"
  }

  getRSISignal(rsi) {
    if (rsi > 70) return "🔴 Overbought"
    if (rsi < 30) return "🟢 Oversold"
    return "🟡 Neutral"
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0

    const returns = []
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i - 1]
      const previousPrice = prices[i]
      if (previousPrice > 0) {
        returns.push((currentPrice - previousPrice) / previousPrice)
      }
    }

    if (returns.length === 0) return 0

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length

    return Math.sqrt(variance) * Math.sqrt(252) * 100 // Annualized volatility
  }
}

// Main execution
async function main() {
  const demo = new PriceAnalyticsDemo()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Interactive mode
    await demo.interactiveDemo()
  } else {
    // Command line mode
    const command = args[0].toLowerCase()

    switch (command) {
      case "single":
        const symbol = args[1] || "RELIANCE"
        await demo.demoSingleStock(symbol)
        break

      case "bulk":
        await demo.demoBulkAnalytics()
        break

      case "history":
        const histSymbol = args[1] || "RELIANCE"
        const days = Number.parseInt(args[2]) || 30
        await demo.demoPriceHistory(histSymbol, days)
        break

      default:
        console.log("❌ Unknown command. Available: single, bulk, history")
        console.log("💡 Run without arguments for interactive mode")
    }
  }
}

// Export for use in other modules
module.exports = PriceAnalyticsDemo

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Demo failed:", error.message)
    process.exit(1)
  })
}
