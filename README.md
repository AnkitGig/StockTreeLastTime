# 🚀 Angel Broking Live Market Data Application

A comprehensive Node.js application for fetching real-time market data from Angel Broking's SmartAPI with WebSocket streaming capabilities.

## ✨ Features

- **Real-time Market Data**: Live stock prices via WebSocket
- **SmartAPI Integration**: Official Angel Broking API integration
- **Symbol Search**: Enhanced search for any stock symbol
- **Interactive Mode**: Command-line interface for stock searching
- **Database Storage**: MongoDB integration for data persistence
- **RESTful API**: Complete REST API for market data access
- **Deployment Ready**: Docker and Render deployment configurations

## 🛠️ Installation

### Prerequisites

- Node.js 16+ 
- MongoDB (local or Atlas)
- Angel Broking SmartAPI credentials

### Quick Setup

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd angel-broking-live-data

# Install dependencies
npm run install-all

# Install additional dependencies for stock search
npm install smartapi-javascript axios speakeasy

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
\`\`\`

### Environment Variables

Create a `.env` file with:

\`\`\`env
# Angel Broking Credentials
CLIENT_CODE=your_client_code
MPIN=your_mpin
SMARTAPI_KEY=your_api_key
TOTP_SECRET=your_totp_secret
CLIENT_IP=192.168.1.1
PUBLIC_IP=your_public_ip

# Database
MONGODB_URI=mongodb://localhost:27017/angelbroking

# Server
PORT=3001
NODE_ENV=development
\`\`\`

## 🎯 Stock Price Fetcher Usage

### Interactive Mode (ESA - Enhanced Search Anywhere)

\`\`\`bash
# Start interactive search
npm run stock-interactive

# Or directly
node scripts/stock-price-fetcher.js --interactive
\`\`\`

**Example Interactive Session:**
\`\`\`
🚀 Enhanced Stock Search (ESA) Mode
Type "exit" to quit, "help" for commands

🔍 Enter stock symbol or name: RELIANCE
✅ Found: RELIANCE-EQ
📋 Token: 3045
📊 Exchange: NSE
💰 Lot Size: 1

💹 Live Price for RELIANCE-EQ: ₹2983.55
📈 Open: ₹2975.00
⬆️ High: ₹2995.80
⬇️ Low: ₹2970.25
📊 Previous Close: ₹2980.00
\`\`\`

### Single Search Mode

\`\`\`bash
# Search for a specific stock
npm run stock-search RELIANCE
node scripts/stock-price-fetcher.js TCS
node scripts/stock-price-fetcher.js "STATE BANK"
\`\`\`

**Example Output:**
\`\`\`
🔍 Searching for: RELIANCE

📥 Downloading Symbol Master file...
✅ Downloaded 50000+ symbols
🔐 Authenticating with SmartAPI...
✅ Login Success

✅ Found: RELIANCE-EQ
📋 Token: 3045
📊 Exchange: NSE
💰 Lot Size: 1

📊 Fetching live price for RELIANCE...
💹 Live Price for RELIANCE-EQ: ₹2983.55
\`\`\`

## 🔍 Search Features

### Enhanced Search Capabilities

1. **Exact Symbol Match**: `RELIANCE`, `TCS`, `SBIN`
2. **Partial Name Search**: `RELI` → finds RELIANCE
3. **Company Name Search**: `STATE BANK` → finds SBIN
4. **Exchange-Specific**: `RELIANCE-EQ`, `NIFTY-INDEX`
5. **Fuzzy Matching**: Similar symbols when exact match not found

### Supported Exchanges

- **NSE**: National Stock Exchange (Equity)
- **BSE**: Bombay Stock Exchange  
- **NFO**: NSE Futures & Options
- **MCX**: Multi Commodity Exchange
- **CDS**: Currency Derivatives

## 🚀 Server Usage

### Start the Full Application

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

### API Endpoints

\`\`\`bash
# Authentication
POST /api/auth/login
GET  /api/auth/status

# Market Data
GET  /api/market-data
GET  /api/market-data/latest
GET  /api/market-data/symbol/:symbol
POST /api/market-data/fetch

# System Status
GET  /api/system/status
GET  /api/system/health
\`\`\`

### WebSocket Connection

\`\`\`javascript
const socket = new WebSocket('ws://localhost:3001/ws');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live Market Data:', data);
};
\`\`\`

## 📊 Database Schema

### MarketData Collection

\`\`\`javascript
{
  token: String,        // Angel Broking token
  symbol: String,       // Stock symbol (RELIANCE, TCS, etc.)
  ltp: Number,         // Last Traded Price
  change: Number,      // Price change
  changePercent: Number, // Percentage change
  open: Number,        // Opening price
  high: Number,        // Day high
  low: Number,         // Day low
  close: Number,       // Previous close
  volume: Number,      // Trading volume
  timestamp: Date      // Data timestamp
}
\`\`\`

## 🐳 Deployment

### Docker Deployment

\`\`\`bash
# Build Docker image
docker build -t angel-broking-app .

# Run container
docker run -p 3001:3001 --env-file .env angel-broking-app
\`\`\`

### Render Deployment

1. Push code to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy using `render.yaml` configuration

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔧 Configuration

### Stock Configuration

Edit `src/config/stockConfig.js` to add/remove stocks:

\`\`\`javascript
const STOCK_CONFIG = {
  NSE: [
    { token: "3045", symbol: "SBIN" },
    { token: "881", symbol: "RELIANCE" },
    // Add more stocks
  ]
};
\`\`\`

### Scheduler Configuration

Market data fetching intervals in `src/services/schedulerService.js`:

\`\`\`javascript
// Fetch every 30 seconds
this.marketDataTask = cron.schedule('*/30 * * * * *', ...);

// Auth check every 5 minutes  
this.authCheckTask = cron.schedule('*/5 * * * *', ...);
\`\`\`

## 🛠️ Development

### Project Structure

\`\`\`
├── scripts/
│   └── stock-price-fetcher.js    # Stock search & price fetcher
├── src/
│   ├── config/                   # Configuration files
│   ├── controllers/              # API controllers
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   └── middleware/               # Express middleware
├── server.js                     # Main server file
├── package.json                  # Dependencies
└── README.md                     # This file
\`\`\`

### Adding New Features

1. **New API Endpoints**: Add to `src/routes/`
2. **Business Logic**: Add to `src/services/`
3. **Database Models**: Add to `src/models/`
4. **Stock Symbols**: Update `src/config/stockConfig.js`

## 🔐 Security

- Environment variables for sensitive data
- JWT token authentication
- TOTP-based login
- Input validation and sanitization
- Rate limiting (recommended for production)

## 📈 Performance

- MongoDB indexing for fast queries
- WebSocket for real-time updates
- Caching of symbol master data
- Efficient data aggregation
- Connection pooling

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check TOTP_SECRET and credentials
   - Verify system time synchronization

2. **Symbol Not Found**
   - Use interactive mode to find similar symbols
   - Check symbol format (RELIANCE vs RELIANCE-EQ)

3. **WebSocket Connection Issues**
   - Check firewall settings
   - Verify port availability

4. **Database Connection**
   - Ensure MongoDB is running
   - Check connection string format

### Debug Mode

\`\`\`bash
# Enable debug logging
DEBUG=* node scripts/stock-price-fetcher.js

# Check system status
curl http://localhost:3001/api/system/status
\`\`\`

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

- Create GitHub issues for bugs
- Check documentation for common solutions
- Review Angel Broking SmartAPI documentation

---

**Happy Trading! 📈🚀**
#   S t o c k T r e e L a s t T i m e  
 