# 📊 Angel Broking API - Postman Collection

This directory contains comprehensive Postman collections for testing the Angel Broking Live Market Data API.

## 📁 Files Included

### 1. `Angel-Broking-API-Collection.json`
Complete Postman collection with all API endpoints organized by functionality:

- **🔐 Authentication** - Login, status, TOTP generation
- **📊 Market Data** - Real-time prices, market statistics
- **📈 Price Analytics** - Live analytics, price history, technical indicators
- **🔍 Stock Search & Viewer** - Search, filtering, detailed stock info
- **📁 File Management** - JSON file operations, watchlists
- **⚙️ System & Health** - System status, health checks
- **🌐 Web Interfaces** - Browser-based interfaces

### 2. `Angel-Broking-Environment.json`
Environment variables for easy configuration:

- `baseUrl` - Server base URL (default: http://localhost:3001)
- `apiUrl` - API base URL
- `wsUrl` - WebSocket URL
- `authToken` - Authentication token (auto-populated)
- Sample tokens and symbols for testing

### 3. `Sample-Test-Data.json`
Sample data and test scenarios:

- Popular stock tokens and symbols
- Test scenarios for different functionalities
- Expected response formats
- Test cases for various endpoints

## 🚀 Quick Setup

### 1. Import Collections
1. Open Postman
2. Click **Import** button
3. Select all three JSON files:
   - `Angel-Broking-API-Collection.json`
   - `Angel-Broking-Environment.json`
   - `Sample-Test-Data.json`

### 2. Set Environment
1. Select **Angel Broking Environment** from the environment dropdown
2. Update `baseUrl` if your server runs on a different port
3. Save the environment

### 3. Start Testing
1. Ensure your Angel Broking server is running (`npm start`)
2. Start with **Authentication** → **Login to Angel Broking**
3. Test other endpoints once authenticated

## 📋 Testing Workflow

### Basic Flow:
\`\`\`
1. System Health Check
   ↓
2. Authentication
   ↓
3. Sync Symbol Master (if needed)
   ↓
4. Test Stock Search
   ↓
5. Test Price Analytics
   ↓
6. Test Market Data
\`\`\`

### Recommended Test Sequence:

#### 1. **Health & System Check**
\`\`\`
GET /api/system/health
GET /api/system/status
GET /api
\`\`\`

#### 2. **Authentication Flow**
\`\`\`
GET /api/auth/status          (should be false)
GET /api/auth/totp           (get TOTP)
POST /api/auth/login         (authenticate)
GET /api/auth/status         (should be true)
\`\`\`

#### 3. **File Operations**
\`\`\`
POST /api/files/sync         (sync symbol master)
GET /api/files/stats         (check file stats)
GET /api/files/files         (check file info)
\`\`\`

#### 4. **Stock Search**
\`\`\`
GET /api/stocks/search?q=RELIANCE
GET /api/stocks/details/RELIANCE
GET /api/stocks/exchange/NSE
GET /api/stocks/stats/exchanges
\`\`\`

#### 5. **Price Analytics**
\`\`\`
GET /api/analytics/live/RELIANCE
GET /api/analytics/history/RELIANCE?days=30
POST /api/analytics/bulk      (with sample data)
\`\`\`

#### 6. **Market Data**
\`\`\`
POST /api/market-data/fetch
GET /api/market-data/latest
GET /api/market-data/stats
\`\`\`

## 🔧 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | Server base URL | `http://localhost:3001` |
| `apiUrl` | API base URL | `{{baseUrl}}/api` |
| `wsUrl` | WebSocket URL | `ws://localhost:3001/ws` |
| `authToken` | Auth token | Auto-populated after login |
| `sampleToken` | Sample stock token | `3045` (RELIANCE) |
| `sampleSymbol` | Sample symbol | `RELIANCE` |

## 📊 Sample Test Data

### Popular Stocks for Testing:
- **RELIANCE** (Token: 3045)
- **TCS** (Token: 2885)
- **HDFCBANK** (Token: 1333)
- **INFY** (Token: 99926004)
- **ICICIBANK** (Token: 1594)

### Test Scenarios:

#### Stock Search Tests:
- Exact symbol: `RELIANCE`
- Partial name: `HDFC`
- Token search: `3045`
- Case insensitive: `tcs`
- Not found: `INVALIDSTOCK`

#### Price Analytics Tests:
- Live analytics: `/analytics/live/RELIANCE`
- Price history: `/analytics/history/TCS?days=30`
- Bulk analytics: Multiple stocks in one request

## 🧪 Automated Tests

Each request includes basic automated tests:

\`\`\`javascript
// Status code validation
pm.test('Status code is successful', function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

// Response time check
pm.test('Response time is acceptable', function () {
    pm.expect(pm.response.responseTime).to.be.below(5000);
});

// JSON validation
pm.test('Response is valid JSON', function () {
    pm.response.json();
});
\`\`\`

## 🔍 Advanced Testing

### Bulk Analytics Request:
\`\`\`json
POST /api/analytics/bulk
{
  "tokens": [
    {"token": "3045", "symbol": "RELIANCE", "exchange": "NSE"},
    {"token": "2885", "symbol": "TCS", "exchange": "NSE"},
    {"token": "1333", "symbol": "HDFCBANK", "exchange": "NSE"}
  ]
}
\`\`\`

### Watchlist Creation:
\`\`\`json
POST /api/files/watchlist
{
  "name": "My Portfolio",
  "symbols": [
    {
      "token": "3045",
      "symbol": "RELIANCE",
      "name": "Reliance Industries Ltd",
      "exchange": "NSE"
    }
  ],
  "userId": "user123"
}
\`\`\`

## 🌐 Web Interface Testing

Access web interfaces directly:
- **Stock Viewer**: `http://localhost:3001/viewer`
- **Price Analytics**: `http://localhost:3001/analytics`
- **WebSocket Test**: `http://localhost:3001/index.html`

## 🚨 Important Notes

1. **Authentication Required**: Most endpoints require authentication
2. **Rate Limiting**: Be mindful of API rate limits
3. **Environment Variables**: Update URLs if running on different ports
4. **File Operations**: Some operations modify JSON files
5. **WebSocket**: Real-time data requires WebSocket connection

## 🔧 Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check if authenticated: `GET /api/auth/status`
   - Re-authenticate: `POST /api/auth/login`

2. **404 Not Found**
   - Verify server is running
   - Check baseUrl in environment

3. **500 Server Error**
   - Check server logs
   - Verify environment variables are set

4. **Symbol Not Found**
   - Sync symbol master: `POST /api/files/sync`
   - Check available symbols: `GET /api/stocks/search?q=<term>`

## 📈 Performance Testing

Use Postman's Collection Runner for:
- Load testing with multiple iterations
- Data-driven testing with CSV files
- Automated test suites
- Performance monitoring

## 🎯 Next Steps

1. Import all collections
2. Set up environment variables
3. Run health checks
4. Authenticate
5. Test core functionality
6. Explore advanced features
7. Set up automated monitoring

Happy Testing! 🚀
