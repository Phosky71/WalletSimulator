# 💳 WalletSimulator

## 📋 Overview

WalletSimulator is a comprehensive cryptocurrency wallet application that enables users to manage digital assets, perform transactions, and exchange cryptocurrencies. Built with modern web technologies, this full-stack application demonstrates secure user authentication, real-time cryptocurrency price integration via CoinRanking API, and peer-to-peer cryptocurrency transfers.

## 🛠️ Technologies Used

### Backend
- **Node.js** (v14+) - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling
- **bcryptjs** - Password hashing and encryption
- **JWT (jsonwebtoken)** - Secure authentication tokens
- **express-session** - Session management
- **cors** - Cross-Origin Resource Sharing
- **axios** - HTTP client for CoinRanking API integration

### Frontend
- **Vanilla JavaScript** - Client-side logic
- **HTML5** - Markup structure
- **CSS3** - Styling and responsive design

### External APIs
- **CoinRanking API** - Real-time cryptocurrency prices and data

## ✨ Features

- 🔐 **User Authentication**: Secure registration and login with encrypted passwords and JWT tokens
- 👤 **User Profile Management**: Each user has a unique public address for receiving cryptocurrencies
- 💰 **Crypto Portfolio**: Add and manage multiple cryptocurrencies in your personal wallet
- 💸 **P2P Transfers**: Send cryptocurrencies to other users using their public address
- 🔄 **Crypto Exchange**: Convert between different cryptocurrencies using real-time exchange rates
- 📊 **Transaction History**: Complete tracking of all transactions (sends, exchanges) with hash generation
- 🔍 **Advanced Filtering**: Filter transactions by hash, user addresses, symbols, amounts, and dates
- 📈 **Real-time Prices**: Integration with CoinRanking API for up-to-date cryptocurrency prices
- 🗄️ **MongoDB Integration**: Reliable data storage and retrieval
- 🔒 **Security**: Password encryption, JWT authentication, and protected API routes
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
WalletSimulator/
├── src/
│   └── backend/
│       ├── config/          # Database and app configuration
│       ├── controllers/     # Request handlers
│       ├── middlewares/     # Authentication and validation
│       ├── models/          # MongoDB schemas
│       │   ├── Cripto.js    # Cryptocurrency holdings model
│       │   ├── Transaction.js # Transaction records model
│       │   └── Users.js     # User accounts model
│       └── routes/          # API endpoints
│           ├── authRoutes.js       # Authentication routes
│           ├── cryptoRoutes.js     # Crypto portfolio management
│           ├── settingsRoutes.js   # User settings
│           ├── transactionRoutes.js # Transactions & transfers
│           └── userRoutes.js       # User management
├── public/
│   └── frontend/
│       ├── css/            # Stylesheets
│       ├── html/           # HTML pages
│       │   ├── login.html     # Login/Register page
│       │   └── portfolio.html # Main portfolio dashboard
│       └── js/             # Client-side JavaScript
├── config/                 # Configuration files
└── package.json           # Dependencies and scripts
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager
- CoinRanking API Key (get one at [coinranking.com](https://coinranking.com))

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/Phosky71/WalletSimulator.git
cd WalletSimulator
```

2. **Install dependencies**
```bash
cd src/backend
npm install
```

3. **Configure environment variables**
Create a `.env` file in the `src/backend` directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret
COINRANKING_API_KEY=your_coinranking_api_key
```

4. **Start MongoDB**
Make sure your MongoDB instance is running.

5. **Run the application**
```bash
npm start
```

6. **Access the application**
Open your browser and navigate to `http://localhost:3000`

## 🔌 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `DELETE /api/auth/delete` - Delete user account

### Cryptocurrency Portfolio Routes
- `GET /api/crypto` - Get user's crypto portfolio
- `POST /api/crypto` - Add cryptocurrency to portfolio
- `GET /api/crypto/cryptocurrencies` - Get list of available cryptocurrencies from CoinRanking
- `GET /api/crypto/cryptocurrencies/:uid` - Get specific cryptocurrency info
- `POST /api/crypto/cryptocurrencies` - Get crypto info by UID

### Transaction Routes
- `GET /api/transactions` - Get user's transaction history
- `POST /api/transactions/exchange` - Calculate exchange rate between cryptocurrencies
- `POST /api/transactions/confirm` - Confirm and execute crypto exchange
- `POST /api/transactions/send` - Send cryptocurrency to another user
- `GET /api/transactions/user-transactions` - Get filtered transactions with advanced search options

### User Routes
- `GET /api/users` - Get user information
- `DELETE /api/users` - Delete user account

## 🎯 Key Functionalities

### Peer-to-Peer Transfers
Users can send cryptocurrencies to other users by providing:
- Receiver's public address
- Cryptocurrency UID and symbol
- Amount to send

The system validates sufficient balance, updates both sender and receiver portfolios, and generates a unique hash for each transaction.

### Cryptocurrency Exchange
Users can exchange between different cryptocurrencies:
1. Select source and target cryptocurrencies
2. Enter amount to exchange
3. System fetches real-time exchange rates from CoinRanking API
4. Confirm exchange to update portfolio
5. Transaction is recorded with unique hash

### Transaction Filtering
Advanced filtering options include:
- **Hash**: Search by transaction hash (partial match)
- **User From/To**: Filter by sender/receiver public address
- **Symbol**: Filter by cryptocurrency symbol
- **Amount**: Filter by minimum amount (from/to)
- **Date**: Filter by specific date
- **Type**: Filter by transaction type (send/exchange)

## 🎓 Learning Objectives

This project demonstrates:

- Full-stack JavaScript development with Node.js and Express
- RESTful API design and implementation
- External API integration (CoinRanking)
- Secure authentication with JWT tokens
- MongoDB database design and relationships
- User-to-user transaction systems
- Real-time data fetching and processing
- Frontend-backend communication
- Session management techniques
- Transaction hash generation using crypto module
- Advanced database querying and filtering

## 🔐 Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens for stateless authentication
- Protected routes require valid authentication
- Input validation on all endpoints using express-validator
- CORS configuration for secure cross-origin requests
- Unique transaction hashes using SHA-256
- Atomic database operations to prevent race conditions
- Balance validation before executing transfers

## 📝 Models

### User Model
- Username, email, password (hashed)
- Public address (unique identifier for receiving funds)
- Timestamps

### Crypto Model
- User reference
- Cryptocurrency UID, name, symbol
- Amount held
- Timestamps

### Transaction Model
- Unique hash (SHA-256)
- User From/To references
- Symbol, from/to amounts
- Transaction type (send/exchange)
- Date timestamp

## 🚧 Future Enhancements

- [ ] Add transaction categories and tags
- [ ] Implement email notifications for transactions
- [ ] Create admin dashboard for system monitoring
- [ ] Add data visualization for portfolio performance
- [ ] Implement two-factor authentication
- [ ] Add support for more cryptocurrency APIs
- [ ] Create mobile app version
- [ ] Implement transaction limits and daily caps
- [ ] Add multi-signature wallet support

## 👨‍💻 Author

**Antonio Juan González-Conde Abril (Phosky71)**
- GitHub: [@Phosky71](https://github.com/Phosky71)

## 📄 License

This project is part of a portfolio demonstrating full-stack development capabilities.

---

*This is an educational project created to demonstrate full-stack web development skills with Node.js, Express, MongoDB, vanilla JavaScript, and external API integration.*
