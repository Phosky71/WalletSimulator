// src/routes/userRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../routes/authRoutes.js');
const { getUserDetails, updateUserProfile, deleteUserProfile } = require('../controllers/userController');
const User = require('../models/Users.js');
const router = express.Router();
const {generatePublicAddress} = require('../middlewares/address.js');

const JWT_SECRET_TEMP = process.env.JWT_SECRET_TEMP;

router.post('/register', generatePublicAddress, async (req, res) => {
    const {username, email, password, publicAddress} = req.body;

    // Comprobación del correo electrónico
    if (!email.includes('@')) {
        return res.status(400).json({msg: 'Invalid email'});
    }

    const emailDomain = email.split('@')[1];
    const allowedDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'alu.murciaeduca.es', 'aluold.murciaeduca.es'];
    if (!allowedDomains.includes(emailDomain)) {
        return res.status(400).json({msg: 'Invalid email domain'});
    }

    try {
        let user = await User.findOne({publicAddress});
        if (user) return res.status(400).json({msg: 'User already exists'});

        // Comprobación de correo electrónico existente
        let emailExists = await User.findOne({email});
        if (emailExists) return res.status(400).json({msg: 'Email already registered'});

        user = new User({username, email, password, publicAddress});
        await user.save();

        res.status(201);
    } catch (err) {
        console.error(err.message);
        if (res.statusCode === 400 && err.message.includes('User')) {
            res.status(400).json({msg: err.message});
        } else if (res.statusCode === 400 && err.message.includes('email')) {
            res.status(400).json({msg: err.message});
        } else {
            res.status(500).json({msg: 'Server Error'});
        }
    }
});


// Login de usuario
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    console.log(req.body);
    try {
        let user = await User.findOne({ email });
        console.log("user");
        console.log(user);
        if (!user) return res.status(400).json({msg: 'Invalid Credentials'});
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(isMatch);
        if (!isMatch) return res.status(400).json({msg: 'Invalid Credentials'});

        const payload = {user: {id: user._id, publicAddress: user.publicAddress}};
        const token = jwt.sign(payload, JWT_SECRET_TEMP, {expiresIn: 3600});

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Asegúrate de que esta bandera esté configurada correctamente
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hora
        });

        res.json({msg: 'Login successful'});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/updateBalance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.balanceHistory.push({ balance: req.body.balance });
        await user.save();
        res.status(200).json({ msg: 'Balance updated' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/balanceHistory', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json(user.balanceHistory);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Obtener detalles del usuario actual
router.get('/me', auth, getUserDetails);

// Actualizar perfil del usuario actual
router.put('/me', auth, updateUserProfile);

// Eliminar usuario actual
router.delete('/me', auth, deleteUserProfile);

module.exports = router;