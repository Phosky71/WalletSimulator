// src/index.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const {connectToCluster, DB_URI} = require('./config/db.js');
const path = require('path');
require('dotenv').config();
// const {check, validationResult} = require('express-validator');
const app = express();


const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Configuración del body-parser
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/frontend/html', 'login.html'));
});


// Configuración de la tienda de sesiones
const store = new MongoDBStore({
    uri: process.env.DB_URI,
    collection: 'sessions'
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Conexión a la base de datos
connectToCluster()
    .then(() => {
        console.log("Successfully connected to the database");
        const PORT = process.env.PORT || 66358;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(error => {
        console.error("An error occurred while connecting to the database", error);
        process.exit(1);
    });

// Rutas
app.use('/api/auth', require('./routes/authRoutes.js')); // Autenticación
app.use('/api/users', require('./routes/userRoutes.js')); // Gestión de usuarios
app.use('/api/crypto', require('./routes/cryptoRoutes.js')); // Criptomonedas
app.use('/api/transactions', require('./routes/transactionRoutes.js')); // Transacciones
app.use('/api/settings', require('./routes/settingsRoutes.js')); // Configuración del usuario
