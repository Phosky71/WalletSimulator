const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../routes/authRoutes.js');
const Crypto = require('../models/Cripto');
const User = require('../models/Users');
const Transaction = require('../models/Transaction');
const router = express.Router();
const crypto = require('crypto'); // Para generar un hash único

// Historial de Transacciones
router.get('/transactions', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Confirmar intercambio y registrar transacción
router.post('/confirm-exchange', auth, async (req, res) => {
    const { fromToken, toToken, amount, exchangedAmount } = req.body;
    console.log(req.body);

    try {
        let fromCryptoDB, toCryptoDB;

        // Si el token no es 'EUR', buscar en la base de datos
        if (fromToken !== 'EUR') {
            fromCryptoDB = await Crypto.findOne({ user: req.user.id, uid: fromToken });
            console.log(fromCryptoDB);
        }

        if (toToken !== 'EUR') {
            toCryptoDB = await Crypto.findOne({ user: req.user.id, uid: toToken });
            console.log(toCryptoDB);
        }

        // Si el token no es 'EUR' y no se encontró en la base de datos, devolver un error
        if ((fromToken !== 'EUR' && !fromCryptoDB) || (toToken !== 'EUR' && !toCryptoDB)) {
            return res.status(404).json({ msg: 'Cryptocurrency not found in user portfolio' });
        }

        // Si el token no es 'EUR', actualizar la cantidad en la base de datos
        if (fromToken !== 'EUR') {
            fromCryptoDB.amount -= amount;
            await fromCryptoDB.save();
        }

        if (toToken !== 'EUR') {
            toCryptoDB.amount += exchangedAmount;
            await toCryptoDB.save();
        }

        // Generar un hash único
        let hash;
        let hashExists = true;
        while (hashExists) {
            hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
            hashExists = await Transaction.findOne({ hash });
        }

        // Registrar la transacción
        const transaction = new Transaction({
            hash: hash,
            userFrom: req.user.id,
            userTo: req.user.id, //TODO Neceario reajuste para userTo
            symbol: fromToken,
            toToken: toToken,
            fromAmount: amount,
            toAmount: exchangedAmount,
            type: 'exchange'
        });

        await transaction.save();

        res.json({
            fromToken: fromCryptoDB,
            toToken: toCryptoDB,
            msg: 'Exchange confirmed and transaction recorded'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Obtener transacciones con filtros opcionales
router.get('/user-transactions', auth, async (req, res) => {
    const { address, symbol, type, startDate, endDate } = req.query;
    const filter = {};

    if (address) {
        filter.$or = [{ userFrom: address }, { userTo: address }];
    }
    if (symbol) {
        filter.symbol = symbol;
    }
    if (type) {
        filter.type = type;
    }
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
            filter.date.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.date.$lte = new Date(endDate);
        }
    }

    console.log("filter");
    try {
        const transactions = await Transaction.find(filter).sort({ date: -1 }).populate('userFrom', 'username publicAddress').populate('userTo', 'username publicAddress');
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;