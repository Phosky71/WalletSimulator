# 💳 WalletSimulator

## 📋 Overview

WalletSimulator is a full-stack digital wallet application designed to simulate financial transactions and balance management. Built with modern web technologies, this project demonstrates secure user authentication, session management, and database integration in a fintech context.

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

### Frontend
- **Vanilla JavaScript** - Client-side logic
- **HTML5** - Markup structure
- **CSS3** - Styling and responsive design

## ✨ Features

- 🔐 **User Authentication**: Secure registration and login with encrypted passwords
- 🎫 **Session Management**: JWT-based authentication with persistent sessions
- 💰 **Balance Operations**: Add, withdraw, and track wallet balance
- 📊 **Transaction History**: Track all financial operations
- 🗄️ **MongoDB Integration**: Reliable data storage and retrieval
- 🔒 **Security**: Password encryption and protected routes
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
│       └── routes/          # API endpoints
├── public/
│   └── frontend/
│       ├── css/            # Stylesheets
│       ├── html/           # HTML pages
│       └── js/             # Client-side JavaScript
├── config/                 # Configuration files
└── package.json           # Dependencies and scripts
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/Phosky71/WalletSimulator.git
cd WalletSimulator
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret
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

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Wallet Operations
- `GET /api/wallet/balance` - Get current balance
- `POST /api/wallet/deposit` - Add funds to wallet
- `POST /api/wallet/withdraw` - Withdraw funds from wallet
- `GET /api/wallet/transactions` - Get transaction history

## 🎓 Learning Objectives

This project serves as an educational example demonstrating:

- Full-stack JavaScript development
- RESTful API design and implementation
- Secure authentication and authorization
- Database design and integration
- Frontend-backend communication
- Session management techniques
- Modern web security practices

## 🔐 Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens for stateless authentication
- Protected routes require authentication
- Input validation on all endpoints
- CORS configuration for secure cross-origin requests

## 🚧 Future Improvements

- [ ] Add transaction categories and filters
- [ ] Implement money transfer between users
- [ ] Add email notifications for transactions
- [ ] Create admin dashboard
- [ ] Add data visualization for spending patterns
- [ ] Implement two-factor authentication
- [ ] Add payment gateway integration

## 👨‍💻 Author

**Antonio Juan González-Conde Abril (Phosky71)**
- GitHub: [@Phosky71](https://github.com/Phosky71)

## 📄 License

This project is part of a portfolio demonstrating full-stack development capabilities.

---

*This is an educational project created to demonstrate full-stack web development skills with Node.js, Express, MongoDB, and vanilla JavaScript.*
