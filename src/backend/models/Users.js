// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true, lowercase: true},
    password: {type: String, required: true},
    publicAddress: {type: String, required: true, unique: true},
    settings: {type: mongoose.Schema.Types.Mixed, default: false},
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


module.exports = mongoose.model('User', UserSchema);