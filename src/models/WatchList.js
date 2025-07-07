const mongoose = require("mongoose")

const watchListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "My Watchlist",
    },
    description: {
      type: String,
      default: "",
    },
    symbols: [
      {
        token: {
          type: String,
          required: true,
        },
        symbol: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        exchange: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
        alertSettings: {
          priceAlert: {
            enabled: {
              type: Boolean,
              default: false,
            },
            targetPrice: {
              type: Number,
              default: 0,
            },
            alertType: {
              type: String,
              enum: ["ABOVE", "BELOW"],
              default: "ABOVE",
            },
          },
          changeAlert: {
            enabled: {
              type: Boolean,
              default: false,
            },
            changePercent: {
              type: Number,
              default: 5,
            },
            alertType: {
              type: String,
              enum: ["GAIN", "LOSS", "BOTH"],
              default: "BOTH",
            },
          },
        },
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: String,
      default: "default_user",
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
watchListSchema.index({ userId: 1, isActive: 1 })
watchListSchema.index({ "symbols.token": 1 })

module.exports = mongoose.model("WatchList", watchListSchema)
