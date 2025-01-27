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
    const {name, bio, password} = req.body;

    // Construir objeto de perfil
    const profileFields = {};
    if (name) profileFields.name = name;
    if (bio) profileFields.bio = bio;
    if (password) {
        const salt = await bcrypt.genSalt(10);
        profileFields.password = await bcrypt.hash(password, salt);
    }

    try {
        let user = await User.findOne({publicAddress: req.user.publicAddress});

        if (!user) {
            return res.status(404).json({msg: 'User not found'});
        }

        // Actualizar usuario
        user = await User.findOneAndUpdate(
            {publicAddress: req.user.publicAddress},
            {$set: profileFields},
            {new: true}
        ).select('-password');

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
            await User.findOneAndRemove({publicAddress: req.user.publicAddress});
            res.json({msg: 'User deleted'});
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

