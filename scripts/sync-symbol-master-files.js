const jsonFileService = require("../src/services/jsonFileService")
require("dotenv").config()

async function syncSymbolMasterFiles() {
  try {
    console.log("🚀 Starting Symbol Master File Sync...")

    // Download and save symbol master
    const result = await jsonFileService.downloadAndSaveSymbolMaster()

    console.log("\n✅ Sync completed successfully!")
    console.log(`📊 Total symbols: ${result.total}`)
    console.log(`📁 File path: ${result.filePath}`)
    console.log(`⏰ Sync time: ${result.syncTime}`)

    // Get file info
    const fileInfo = await jsonFileService.getFileInfo()
    console.log("\n📁 File Information:")
    Object.entries(fileInfo).forEach(([name, info]) => {
      const status = info.exists ? "✅" : "❌"
      console.log(`   ${status} ${name}: ${info.sizeFormatted} (${info.path})`)
    })

    // Get collection stats
    const stats = await jsonFileService.getStats()
    console.log("\n📈 Collection Statistics:")
    console.log(`   Symbols: ${stats.collections.symbols}`)
    console.log(`   Searches: ${stats.collections.searches}`)
    console.log(`   Price History: ${stats.collections.priceHistory}`)
    console.log(`   Watchlists: ${stats.collections.watchLists}`)

    console.log("\n🏢 Exchange Distribution:")
    stats.exchanges.forEach((exchange) => {
      console.log(`   ${exchange.exchange}: ${exchange.count}`)
    })

    console.log("\n🎉 File-based JSON collection system ready!")
    process.exit(0)
  } catch (error) {
    console.error("❌ Sync failed:", error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  syncSymbolMasterFiles()
}

module.exports = { syncSymbolMasterFiles }
