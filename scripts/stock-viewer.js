const jsonFileService = require("../src/services/jsonFileService")
const readline = require("readline")
const Table = require("cli-table3")

class StockViewer {
  constructor() {
    this.allStocks = []
    this.filteredStocks = []
    this.currentPage = 1
    this.itemsPerPage = 20
    this.currentExchange = "ALL" // ALL, NSE, BSE
    this.sortBy = "symbol" // symbol, name, exchange
    this.sortOrder = "asc" // asc, desc
  }

  /**
   * Initialize and load stock data
   */
  async initialize() {
    try {
      console.log("📊 Loading stock data...")
      this.allStocks = await jsonFileService.loadSymbolMaster()

      if (this.allStocks.length === 0) {
        console.log("📥 No stock data found. Downloading...")
        await jsonFileService.downloadAndSaveSymbolMaster()
        this.allStocks = await jsonFileService.loadSymbolMaster()
      }

      this.filteredStocks = [...this.allStocks]
      console.log(`✅ Loaded ${this.allStocks.length} stocks`)

      // Show exchange distribution
      this.showExchangeStats()
    } catch (error) {
      console.error("❌ Error initializing:", error.message)
      throw error
    }
  }

  /**
   * Show exchange statistics
   */
  showExchangeStats() {
    const exchangeStats = {}
    this.allStocks.forEach((stock) => {
      exchangeStats[stock.exchange] = (exchangeStats[stock.exchange] || 0) + 1
    })

    console.log("\n📈 Exchange Distribution:")
    Object.entries(exchangeStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([exchange, count]) => {
        console.log(`   ${exchange}: ${count.toLocaleString()} stocks`)
      })
  }

  /**
   * Filter stocks by exchange
   */
  filterByExchange(exchange) {
    this.currentExchange = exchange.toUpperCase()

    if (this.currentExchange === "ALL") {
      this.filteredStocks = [...this.allStocks]
    } else {
      this.filteredStocks = this.allStocks.filter((stock) => stock.exchange === this.currentExchange)
    }

    this.currentPage = 1
    console.log(`📊 Filtered to ${this.filteredStocks.length} stocks (${this.currentExchange})`)
  }

  /**
   * Search stocks by symbol or name
   */
  searchStocks(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      this.filteredStocks = [...this.allStocks]
      console.log("🔍 Search cleared. Showing all stocks.")
      return
    }

    const term = searchTerm.toLowerCase()
    this.filteredStocks = this.allStocks.filter(
      (stock) => stock.symbol.toLowerCase().includes(term) || stock.name.toLowerCase().includes(term),
    )

    this.currentPage = 1
    console.log(`🔍 Found ${this.filteredStocks.length} stocks matching "${searchTerm}"`)
  }

  /**
   * Sort stocks
   */
  sortStocks(sortBy, order = "asc") {
    this.sortBy = sortBy
    this.sortOrder = order

    this.filteredStocks.sort((a, b) => {
      let aVal = a[sortBy] || ""
      let bVal = b[sortBy] || ""

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (order === "desc") {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    console.log(`📊 Sorted by ${sortBy} (${order})`)
  }

  /**
   * Display stocks in table format
   */
  displayStocks() {
    if (this.filteredStocks.length === 0) {
      console.log("❌ No stocks to display")
      return
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredStocks.length)
    const pageStocks = this.filteredStocks.slice(startIndex, endIndex)

    // Create table
    const table = new Table({
      head: ["#", "Symbol", "Name", "Exchange", "Token", "Lot Size", "Instrument"],
      colWidths: [5, 15, 35, 10, 12, 10, 15],
      style: {
        head: ["cyan", "bold"],
        border: ["grey"],
      },
    })

    pageStocks.forEach((stock, index) => {
      table.push([
        startIndex + index + 1,
        stock.symbol || "",
        (stock.name || "").substring(0, 32),
        stock.exchange || "",
        stock.token || "",
        stock.lot_size || 1,
        (stock.instrumenttype || "").substring(0, 12),
      ])
    })

    console.log(`\n📊 Stocks ${startIndex + 1}-${endIndex} of ${this.filteredStocks.length}`)
    console.log(`📈 Exchange: ${this.currentExchange} | Sort: ${this.sortBy} (${this.sortOrder})`)
    console.log(table.toString())

    // Show pagination info
    const totalPages = Math.ceil(this.filteredStocks.length / this.itemsPerPage)
    console.log(`\n📄 Page ${this.currentPage} of ${totalPages}`)
  }

  /**
   * Get detailed stock information
   */
  async getStockDetails(identifier) {
    try {
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
        console.log(`❌ Stock "${identifier}" not found`)
        return null
      }

      // Display detailed information
      console.log("\n" + "=".repeat(60))
      console.log(`📊 STOCK DETAILS: ${stock.symbol}`)
      console.log("=".repeat(60))

      const detailsTable = new Table({
        style: { border: ["grey"] },
      })

      detailsTable.push(
        ["Symbol", stock.symbol || "N/A"],
        ["Name", stock.name || "N/A"],
        ["Token", stock.token || "N/A"],
        ["Exchange", stock.exchange || "N/A"],
        ["Exchange Segment", stock.exch_seg || "N/A"],
        ["Instrument Type", stock.instrumenttype || "N/A"],
        ["Lot Size", stock.lot_size || "N/A"],
        ["Tick Size", stock.tick_size || "N/A"],
        ["Strike Price", stock.strike || "N/A"],
        ["Expiry", stock.expiry || "N/A"],
        ["ISIN", stock.isin || "N/A"],
        ["Precision", stock.precision || "N/A"],
        ["Multiplier", stock.multiplier || "N/A"],
        ["Last Updated", stock.lastUpdated || "N/A"],
      )

      console.log(detailsTable.toString())

      return stock
    } catch (error) {
      console.error("❌ Error getting stock details:", error.message)
      return null
    }
  }

  /**
   * Show BSE stocks only
   */
  showBSEStocks() {
    this.filterByExchange("BSE")
    this.displayStocks()
  }

  /**
   * Show NSE stocks only
   */
  showNSEStocks() {
    this.filterByExchange("NSE")
    this.displayStocks()
  }

  /**
   * Show all stocks
   */
  showAllStocks() {
    this.filterByExchange("ALL")
    this.displayStocks()
  }

  /**
   * Navigate to next page
   */
  nextPage() {
    const totalPages = Math.ceil(this.filteredStocks.length / this.itemsPerPage)
    if (this.currentPage < totalPages) {
      this.currentPage++
      this.displayStocks()
    } else {
      console.log("📄 Already on last page")
    }
  }

  /**
   * Navigate to previous page
   */
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.displayStocks()
    } else {
      console.log("📄 Already on first page")
    }
  }

  /**
   * Go to specific page
   */
  goToPage(pageNumber) {
    const totalPages = Math.ceil(this.filteredStocks.length / this.itemsPerPage)
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      this.currentPage = pageNumber
      this.displayStocks()
    } else {
      console.log(`📄 Invalid page number. Valid range: 1-${totalPages}`)
    }
  }

  /**
   * Export current filtered results
   */
  async exportResults(filename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const defaultFilename = `stock-export-${this.currentExchange}-${timestamp}.json`
      const exportFilename = filename || defaultFilename

      const exportData = {
        metadata: {
          totalStocks: this.filteredStocks.length,
          exchange: this.currentExchange,
          sortBy: this.sortBy,
          sortOrder: this.sortOrder,
          exportTime: new Date().toISOString(),
          filename: exportFilename,
        },
        data: this.filteredStocks,
      }

      const fs = require("fs").promises
      await fs.writeFile(exportFilename, JSON.stringify(exportData, null, 2))

      console.log(`✅ Exported ${this.filteredStocks.length} stocks to ${exportFilename}`)
      return exportFilename
    } catch (error) {
      console.error("❌ Error exporting results:", error.message)
      throw error
    }
  }

  /**
   * Interactive command interface
   */
  async startInteractiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    console.log("\n🚀 Stock Viewer - Interactive Mode")
    console.log("=".repeat(50))
    this.showHelp()
    this.displayStocks()

    const askCommand = () => {
      rl.question("\n📊 Enter command: ", async (input) => {
        const [command, ...args] = input.trim().split(" ")
        const arg = args.join(" ")

        try {
          switch (command.toLowerCase()) {
            case "help":
            case "h":
              this.showHelp()
              break

            case "all":
              this.showAllStocks()
              break

            case "nse":
              this.showNSEStocks()
              break

            case "bse":
              this.showBSEStocks()
              break

            case "search":
            case "s":
              if (arg) {
                this.searchStocks(arg)
                this.displayStocks()
              } else {
                console.log("❌ Please provide search term: search RELIANCE")
              }
              break

            case "details":
            case "d":
              if (arg) {
                await this.getStockDetails(arg)
              } else {
                console.log("❌ Please provide symbol or token: details RELIANCE")
              }
              break

            case "sort":
              if (args.length >= 1) {
                const sortBy = args[0]
                const order = args[1] || "asc"
                this.sortStocks(sortBy, order)
                this.displayStocks()
              } else {
                console.log("❌ Usage: sort symbol|name|exchange [asc|desc]")
              }
              break

            case "next":
            case "n":
              this.nextPage()
              break

            case "prev":
            case "p":
              this.prevPage()
              break

            case "page":
              if (arg && !isNaN(arg)) {
                this.goToPage(Number.parseInt(arg))
              } else {
                console.log("❌ Please provide page number: page 5")
              }
              break

            case "export":
              await this.exportResults(arg)
              break

            case "stats":
              this.showExchangeStats()
              break

            case "clear":
              console.clear()
              this.displayStocks()
              break

            case "refresh":
              await jsonFileService.downloadAndSaveSymbolMaster()
              await this.initialize()
              this.displayStocks()
              break

            case "exit":
            case "quit":
            case "q":
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

    askCommand()
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log("\n📖 Available Commands:")
    console.log("=".repeat(50))
    console.log("📊 VIEWING:")
    console.log("  all              - Show all stocks")
    console.log("  nse              - Show NSE stocks only")
    console.log("  bse              - Show BSE stocks only")
    console.log("  stats            - Show exchange statistics")
    console.log("")
    console.log("🔍 SEARCHING:")
    console.log("  search <term>    - Search stocks (s RELIANCE)")
    console.log("  details <symbol> - Show detailed stock info (d RELIANCE)")
    console.log("")
    console.log("📄 NAVIGATION:")
    console.log("  next             - Next page (n)")
    console.log("  prev             - Previous page (p)")
    console.log("  page <number>    - Go to specific page")
    console.log("")
    console.log("📊 SORTING:")
    console.log("  sort <field> [order] - Sort by symbol/name/exchange [asc/desc]")
    console.log("")
    console.log("💾 UTILITIES:")
    console.log("  export [filename] - Export current results to JSON")
    console.log("  refresh          - Download fresh stock data")
    console.log("  clear            - Clear screen")
    console.log("  help             - Show this help (h)")
    console.log("  exit             - Exit program (q)")
    console.log("=".repeat(50))
  }
}

// Main execution
async function main() {
  const viewer = new StockViewer()

  try {
    await viewer.initialize()

    const args = process.argv.slice(2)

    if (args.length === 0) {
      // Interactive mode
      await viewer.startInteractiveMode()
    } else {
      // Command line mode
      const command = args[0].toLowerCase()
      const searchTerm = args.slice(1).join(" ")

      switch (command) {
        case "all":
          viewer.showAllStocks()
          break

        case "nse":
          viewer.showNSEStocks()
          break

        case "bse":
          viewer.showBSEStocks()
          break

        case "search":
          if (searchTerm) {
            viewer.searchStocks(searchTerm)
            viewer.displayStocks()
          } else {
            console.log("❌ Please provide search term")
          }
          break

        case "details":
          if (searchTerm) {
            await viewer.getStockDetails(searchTerm)
          } else {
            console.log("❌ Please provide symbol or token")
          }
          break

        default:
          console.log("❌ Unknown command. Available: all, nse, bse, search, details")
          console.log("💡 Run without arguments for interactive mode")
      }
    }
  } catch (error) {
    console.error("❌ Application error:", error.message)
    process.exit(1)
  }
}

// Export for use in other modules
module.exports = StockViewer

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error.message)
    process.exit(1)
  })
}
