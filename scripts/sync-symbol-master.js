const mongoose = require("mongoose")
const jsonCollectionService = require("../src/services/jsonCollectionService")
require("dotenv").config()

async function syncSymbolMaster() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/angelbroking", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("📊 Connected to MongoDB")

    // Sync symbol master
    const result = await jsonCollectionService.syncSymbolMaster()

    console.log("\n✅ Sync completed successfully!")
    console.log(`📊 Total symbols: ${result.total}`)
    console.log(`➕ Inserted: ${result.inserted}`)
    console.log(`🔄 Updated: ${result.updated}`)
    console.log(`⏰ Sync time: ${result.syncTime}`)

    // Get collection stats
    const stats = await jsonCollectionService.getCollectionStats()
    console.log("\n📈 Collection Statistics:")
    console.log(`   Symbols: ${stats.collections.symbols}`)
    console.log(`   Searches: ${stats.collections.searches}`)
    console.log(`   Price History: ${stats.collections.priceHistory}`)
    console.log(`   Watchlists: ${stats.collections.watchLists}`)

    console.log("\n🏢 Exchange Distribution:")
    stats.exchanges.forEach((exchange) => {
      console.log(`   ${exchange._id}: ${exchange.count}`)
    })

    process.exit(0)
  } catch (error) {
    console.error("❌ Sync failed:", error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  syncSymbolMaster()
}

module.exports = { syncSymbolMaster }
