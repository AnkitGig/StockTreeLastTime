const mongoose = require("mongoose")

const stockSymbolSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    exchange: {
      type: String,
      required: true,
      enum: ["NSE", "BSE", "NFO", "BFO", "MCX", "CDS"],
      index: true,
    },
    exch_seg: {
      type: String,
      required: true,
    },
    instrumenttype: {
      type: String,
      default: "",
    },
    strike: {
      type: Number,
      default: 0,
    },
    tick_size: {
      type: Number,
      default: 0.05,
    },
    lot_size: {
      type: Number,
      default: 1,
    },
    expiry: {
      type: String,
      default: "",
    },
    gen_num: {
      type: Number,
      default: 0,
    },
    precision: {
      type: Number,
      default: 2,
    },
    multiplier: {
      type: Number,
      default: 1,
    },
    isin: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for efficient searching
stockSymbolSchema.index({ symbol: 1, exchange: 1 })
stockSymbolSchema.index({ name: "text", symbol: "text" })
stockSymbolSchema.index({ exchange: 1, instrumenttype: 1 })

module.exports = mongoose.model("StockSymbol", stockSymbolSchema)
