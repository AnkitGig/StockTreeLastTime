const APP_CONFIG = {
  // Database configuration
  database: {
    saveMarketData: false, // Set to false to disable database saving
    savePriceHistory: false, // Set to false to disable price history saving
    saveSearchHistory: true, // Keep search history enabled
  },

  // Broadcasting configuration
  broadcast: {
    enabled: true,
    interval: 5000, // 5 seconds
    maxClients: 100,
  },

  // Market data configuration
  marketData: {
    mode: "FULL", // FULL or LTP
    fetchInterval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },

  // Logging configuration
  logging: {
    level: "info", // debug, info, warn, error
    saveToFile: false,
    showPrices: true,
    showBroadcast: true,
  },

  // Performance configuration
  performance: {
    maxConcurrentRequests: 5,
    requestTimeout: 10000, // 10 seconds
    cacheTimeout: 60000, // 1 minute
  },
}

module.exports = APP_CONFIG
