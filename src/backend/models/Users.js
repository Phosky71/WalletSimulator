// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Crypto = require('./Cripto');


const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    password: {type: String, required: true},
    publicAddress: {type: String, required: true, unique: true},
    settings: {type: mongoose.Schema.Types.Mixed, default: false},
    balanceHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        balance: {
            type: Number,
            required: true
        }
    }],
});

// Hash de contraseña antes de guardar el usuario
UserSchema.pre('save', async function (next) {
    this.username = this.username.toLowerCase();
    this.email = this.email.toLowerCase();
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.pre('findOneAndDelete', async function (next) {
    const userId = this.getQuery()._id; // Obtén el ID del usuario que se va a eliminar
    try {
        // Elimina todas las criptomonedas asociadas al usuario
        await Crypto.deleteMany({user: userId});
        next();
    } catch (error) {
        next(error);
    }
});



module.exports = mongoose.model('User', UserSchema);