// Middleware para generar la dirección pública
// src/backend/middlewares/address.js
const User = require('../models/Users.js');

async function generatePublicAddress(req, res, next) {
    const nanoidModule = await import('nanoid');
    const nanoid = nanoidModule.customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 26);

    let unique = false;
    let publicAddress;

    while (!unique) {
        publicAddress = nanoid();
        const user = await User.findOne({publicAddress});
        if (!user) {
            unique = true;
        }
    }

    req.body.publicAddress = publicAddress;
    next();
}

module.exports = {generatePublicAddress};