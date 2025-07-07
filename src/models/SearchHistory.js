const mongoose = require("mongoose")

const searchHistorySchema = new mongoose.Schema(
  {
    searchTerm: {
      type: String,
      required: true,
      index: true,
    },
    searchType: {
      type: String,
      enum: ["EXACT", "PARTIAL", "FUZZY", "NOT_FOUND"],
      default: "EXACT",
    },
    resultFound: {
      type: Boolean,
      default: false,
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    selectedSymbol: {
      token: String,
      symbol: String,
      name: String,
      exchange: String,
    },
    priceData: {
      ltp: Number,
      change: Number,
      changePercent: Number,
      fetchTime: Date,
    },
    searchTime: {
      type: Date,
      default: Date.now,
    },
    userIP: {
      type: String,
      default: "",
    },
    sessionId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for analytics
searchHistorySchema.index({ searchTime: -1 })
searchHistorySchema.index({ searchTerm: 1, searchTime: -1 })
searchHistorySchema.index({ resultFound: 1, searchTime: -1 })

module.exports = mongoose.model("SearchHistory", searchHistorySchema)
