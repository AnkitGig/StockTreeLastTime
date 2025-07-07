const mongoose = require("mongoose")

const priceHistorySchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    exchange: {
      type: String,
      required: true,
    },
    priceData: {
      ltp: {
        type: Number,
        required: true,
      },
      open: {
        type: Number,
        default: 0,
      },
      high: {
        type: Number,
        default: 0,
      },
      low: {
        type: Number,
        default: 0,
      },
      close: {
        type: Number,
        default: 0,
      },
      volume: {
        type: Number,
        default: 0,
      },
      change: {
        type: Number,
        default: 0,
      },
      changePercent: {
        type: Number,
        default: 0,
      },
    },
    technicalIndicators: {
      rsi: {
        type: Number,
        default: null,
      },
      sma20: {
        type: Number,
        default: null,
      },
      sma50: {
        type: Number,
        default: null,
      },
      ema12: {
        type: Number,
        default: null,
      },
      ema26: {
        type: Number,
        default: null,
      },
      macd: {
        type: Number,
        default: null,
      },
    },
    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "PRE_OPEN", "POST_CLOSE"],
      default: "OPEN",
    },
    dataSource: {
      type: String,
      enum: ["SMARTAPI", "WEBSOCKET", "MANUAL"],
      default: "SMARTAPI",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for time-series queries
priceHistorySchema.index({ token: 1, timestamp: -1 })
priceHistorySchema.index({ symbol: 1, timestamp: -1 })
priceHistorySchema.index({ exchange: 1, timestamp: -1 })

module.exports = mongoose.model("PriceHistory", priceHistorySchema)
