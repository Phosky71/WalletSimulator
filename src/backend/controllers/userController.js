// src/controllers/userController.js
const User = require('../models/Users.js');
const bcrypt = require('bcryptjs');

// Obtener detalles del usuario
exports.getUserDetails = async (req, res) => {
    console.log(req.user);
    try {
        const user = await User.findOne({publicAddress: req.user.publicAddress}).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Actualizar perfil del usuario
exports.updateUserProfile = async (req, res) => {
    const { name, bio, password, balance } = req.body;

    // Construir objeto de perfil
    const profileFields = {};
    if (name) profileFields.name = name;
    if (bio) profileFields.bio = bio;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        profileFields.password = await bcrypt.hash(password, salt);
    }

    try {
        let user = await User.findOne({ publicAddress: req.user.publicAddress });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Actualizar usuario
        user = await User.findOneAndUpdate(
            { publicAddress: req.user.publicAddress },
            { $set: profileFields },
            { new: true }
        ).select('-password');

        // Actualizar balance
        if (balance !== undefined) {
            const today = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
            const existingBalance = user.balanceHistory.find(entry => entry.date.toISOString().split('T')[0] === today);

            if (existingBalance) {
                // Calcular la nueva media
                existingBalance.balance = (existingBalance.balance + balance) / 2;
            } else {
                // Añadir nuevo balance
                user.balanceHistory.push({ date: new Date(), balance });
            }

            await user.save();
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUserSettings = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            {publicAddress: req.user.publicAddress},
            {$set: req.body},
            {new: true}
        );
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getUserSettings = async (req, res) => {
    try {
        const user = await User.findOne({ publicAddress: req.user.publicAddress }).select('settings');
        res.json(user.settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Eliminar usuario
exports.deleteUserProfile = async (req, res) => {
    try {
        res.clearCookie('token');
        req.session.destroy(async (err) => {
            if (err) {
                return res.status(500).send('Failed to log out');
            }

            const user = await User.findOneAndDelete({ publicAddress: req.user.publicAddress });

            if (!user) {
                return res.status(404).json({ msg: 'Usuario no encontrado' });
            }

            res.json({ msg: 'User and related data deleted' });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

