const axios = require("axios")
const { SmartAPI } = require("smartapi-javascript")
const readline = require("readline")
const jsonFileService = require("../src/services/jsonFileService")

// Configuration
const CONFIG = {
  SYMBOL_MASTER_URL: "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json",
  API_KEY: process.env.SMARTAPI_KEY || "a2syiZnn",
  CLIENT_CODE: process.env.CLIENT_CODE || "RSIKA1012",
  PASSWORD: process.env.MPIN || "9993",
  TOTP_SECRET: process.env.TOTP_SECRET || "AEY6BQA2HO3LJR4RPYOFWNIWK4",
}

class StockPriceFetcher {
  constructor() {
    this.smartApi = new SmartAPI({
      api_key: CONFIG.API_KEY,
    })
    this.isAuthenticated = false
  }

  /**
   * Search symbol using file service
   */
  async searchSymbol(searchTerm) {
    try {
      // Try to search in JSON files first
      const results = await jsonFileService.searchSymbols(searchTerm, 1)
      if (results.length > 0) {
        console.log("📁 Found in JSON files")
        return results[0]
      }

      // If not found in files, download fresh data
      console.log("📥 Symbol not found in files, downloading fresh data...")
      await jsonFileService.downloadAndSaveSymbolMaster()

      // Try search again
      const freshResults = await jsonFileService.searchSymbols(searchTerm, 1)
      return freshResults.length > 0 ? freshResults[0] : null
    } catch (error) {
      console.error("❌ Error searching symbol:", error.message)
      return null
    }
  }

  /**
   * Search for multiple symbols
   */
  async searchMultipleSymbols(searchTerm, limit = 10) {
    try {
      return await jsonFileService.searchSymbols(searchTerm, limit)
    } catch (error) {
      console.error("❌ Error searching multiple symbols:", error.message)
      return []
    }
  }

  /**
   * Generate TOTP for authentication
   */
  generateTOTP() {
    const speakeasy = require("speakeasy")

    return speakeasy.totp({
      secret: CONFIG.TOTP_SECRET,
      encoding: "base32",
    })
  }

  /**
   * Authenticate with SmartAPI
   */
  async authenticate() {
    try {
      console.log("🔐 Authenticating with SmartAPI...")

      const totp = this.generateTOTP()

      const loginResponse = await this.smartApi.generateSession(CONFIG.CLIENT_CODE, CONFIG.PASSWORD, totp)

      if (loginResponse.status && loginResponse.data) {
        this.isAuthenticated = true
        console.log("✅ Login Success")
        console.log(`📊 Session Token: ${loginResponse.data.jwtToken.substring(0, 20)}...`)
        return loginResponse.data
      } else {
        throw new Error(`Login failed: ${loginResponse.message}`)
      }
    } catch (error) {
      console.error("❌ Authentication failed:", error.message)
      throw error
    }
  }

  /**
   * Get live price for a token
   */
  async getLivePrice(exchange, symbolToken, symbol) {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate()
      }

      console.log(`📊 Fetching live price for ${symbol}...`)

      const ltpResponse = await this.smartApi.getLTP({
        exchange: exchange,
        tradingsymbol: symbol,
        symboltoken: symbolToken,
      })

      if (ltpResponse.status && ltpResponse.data) {
        return ltpResponse.data
      } else {
        throw new Error(`Failed to get LTP: ${ltpResponse.message}`)
      }
    } catch (error) {
      console.error("❌ Error fetching live price:", error.message)
      throw error
    }
  }

  /**
   * Main function to search and get price
   */
  async searchAndGetPrice(searchTerm) {
    try {
      // Search for the symbol
      const symbolData = await this.searchSymbol(searchTerm)

      if (!symbolData) {
        console.log(`❌ Symbol "${searchTerm}" not found`)

        // Show similar symbols
        const similarSymbols = await this.searchMultipleSymbols(searchTerm, 5)
        if (similarSymbols.length > 0) {
          console.log("\n🔍 Similar symbols found:")
          similarSymbols.forEach((item, index) => {
            console.log(`${index + 1}. ${item.name}-${item.exchange} (Token: ${item.token})`)
          })
        }
        return null
      }

      console.log(`\n✅ Found: ${symbolData.name}-${symbolData.exchange}`)
      console.log(`📋 Token: ${symbolData.token}`)
      console.log(`📊 Exchange: ${symbolData.exchange}`)
      console.log(`💰 Lot Size: ${symbolData.lot_size}`)

      // Get live price
      const priceData = await this.getLivePrice(symbolData.exchange, symbolData.token, symbolData.symbol)

      if (priceData) {
        console.log(`\n💹 Live Price for ${symbolData.name}-${symbolData.exchange}: ₹${priceData.ltp}`)

        if (priceData.open) console.log(`📈 Open: ₹${priceData.open}`)
        if (priceData.high) console.log(`⬆️ High: ₹${priceData.high}`)
        if (priceData.low) console.log(`⬇️ Low: ₹${priceData.low}`)
        if (priceData.close) console.log(`📊 Previous Close: ₹${priceData.close}`)

        // Save price data to file
        await jsonFileService.savePriceData(symbolData.token, symbolData.symbol, symbolData.exchange, priceData)
        console.log("💾 Price data saved to file")
      }

      return {
        symbol: symbolData,
        price: priceData,
      }
    } catch (error) {
      console.error("❌ Error in searchAndGetPrice:", error.message)
      throw error
    }
  }

  /**
   * Interactive search mode (ESA Feature)
   */
  async interactiveSearch() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log("\n🚀 Enhanced Stock Search (ESA) Mode - File-Based")
    console.log('Type "exit" to quit, "help" for commands\n')

    const askQuestion = () => {
      rl.question("🔍 Enter stock symbol or name: ", async (input) => {
        const trimmedInput = input.trim()

        if (trimmedInput.toLowerCase() === "exit") {
          console.log("👋 Goodbye!")
          rl.close()
          return
        }

        if (trimmedInput.toLowerCase() === "help") {
          console.log("\n📖 Available commands:")
          console.log("  - Enter any stock symbol (e.g., RELIANCE, SBIN, TCS)")
          console.log("  - Enter partial names (e.g., RELI, HDFC, INFY)")
          console.log('  - Type "exit" to quit')
          console.log('  - Type "help" for this message')
          console.log('  - Type "stats" for file statistics\n')
          askQuestion()
          return
        }

        if (trimmedInput.toLowerCase() === "stats") {
          try {
            const stats = await jsonFileService.getStats()
            const fileInfo = await jsonFileService.getFileInfo()

            console.log("\n📊 File Statistics:")
            console.log(`   Symbols: ${stats.collections.symbols}`)
            console.log(`   Searches: ${stats.collections.searches}`)
            console.log(`   Price History: ${stats.collections.priceHistory}`)

            console.log("\n📁 File Sizes:")
            Object.entries(fileInfo).forEach(([name, info]) => {
              if (info.exists) {
                console.log(`   ${name}: ${info.sizeFormatted}`)
              }
            })
          } catch (error) {
            console.error("❌ Error getting stats:", error.message)
          }
          console.log()
          askQuestion()
          return
        }

        if (trimmedInput === "") {
          console.log("⚠️ Please enter a stock symbol or name\n")
          askQuestion()
          return
        }

        try {
          await this.searchAndGetPrice(trimmedInput)
        } catch (error) {
          console.error("❌ Search failed:", error.message)
        }

        console.log("\n" + "=".repeat(50) + "\n")
        askQuestion()
      })
    }

    // Initialize and start
    try {
      await this.authenticate()
      askQuestion()
    } catch (error) {
      console.error("❌ Initialization failed:", error.message)
      rl.close()
    }
  }
}

// Main execution
async function main() {
  const fetcher = new StockPriceFetcher()

  // Check command line arguments
  const args = process.argv.slice(2)

  if (args.length === 0) {
    // Interactive mode
    await fetcher.interactiveSearch()
  } else if (args[0] === "--interactive" || args[0] === "-i") {
    // Explicit interactive mode
    await fetcher.interactiveSearch()
  } else {
    // Single search mode
    const searchTerm = args.join(" ")
    console.log(`🔍 Searching for: ${searchTerm}\n`)

    try {
      await fetcher.searchAndGetPrice(searchTerm)
    } catch (error) {
      console.error("❌ Script failed:", error.message)
      process.exit(1)
    }
  }
}

// Export for use in other modules
module.exports = StockPriceFetcher

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error.message)
    process.exit(1)
  })
}
