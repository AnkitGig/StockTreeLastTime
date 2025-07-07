const STOCK_CONFIG = {
  NSE: [
    { token: "3045", symbol: "SBIN" },
    { token: "881", symbol: "RELIANCE" },
    { token: "99926004", symbol: "INFY" },
    { token: "2885", symbol: "TCS" },
    { token: "1333", symbol: "HDFCBANK" },
    { token: "17963", symbol: "ITC" },
    { token: "11536", symbol: "LT" },
    { token: "1660", symbol: "KOTAKBANK" },
    { token: "288", symbol: "AXISBANK" },
    { token: "5633", symbol: "MARUTI" },
    { token: "1594", symbol: "ICICIBANK" },
    { token: "10999", symbol: "BHARTIARTL" },
    { token: "526", symbol: "BAJFINANCE" },
    { token: "16675", symbol: "ASIANPAINT" },
    { token: "1330", symbol: "HDFC" },
  ],
  NFO: [{ token: "58662", symbol: "NIFTY_JUN_FUT" }],
}

const getAllStocks = () => {
  return [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
}

const getStockByToken = (token) => {
  const allStocks = getAllStocks()
  return allStocks.find((stock) => stock.token === token)
}

const getTokensByExchange = () => {
  return {
    NSE: STOCK_CONFIG.NSE.map((stock) => stock.token),
    NFO: STOCK_CONFIG.NFO.map((stock) => stock.token),
  }
}

module.exports = {
  STOCK_CONFIG,
  getAllStocks,
  getStockByToken,
  getTokensByExchange,
}
