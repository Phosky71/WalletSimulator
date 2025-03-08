const express = require('express');
const {check, validationResult} = require('express-validator');
const auth = require('../routes/authRoutes.js');
const Crypto = require('../models/Cripto');
const User = require('../models/Users.js');
const Transaction = require('../models/Transaction');
const router = express.Router();
const crypto = require('crypto'); // Para generar un hash único
const axios = require('axios');

//Cambiar criptomonedas
router.post('/exchange', auth, async (req, res) => {
    const {fromToken, toToken, amount} = req.body;

    try {
        // Obtener cotizaciones de la API de Coinranking
        const response = await axios.get('https://api.coinranking.com/v2/coins', {
            headers: {
                'x-access-token': process.env.COINRANKING_API_KEY
            }
        });

        const coins = response.data.data.coins;
        const fromCrypto = fromToken !== 'EUR' ? coins.find(coin => coin.uuid === fromToken) : {
            price: 1.09,
            symbol: 'EUR'
        };
        const toCrypto = toToken !== 'EUR' ? coins.find(coin => coin.uuid === toToken) : {price: 1.09, symbol: 'EUR'};

        if ((!fromCrypto && fromToken !== 'EUR') || (!toCrypto && toToken !== 'EUR')) {
            return res.status(404).json({msg: 'Cryptocurrency not found'});
        }

        const fromPrice = fromCrypto.price;
        const toPrice = toCrypto.price;

        const exchangeRate = fromPrice / toPrice;
        const exchangedAmount = amount * exchangeRate;

        res.json({
            fromToken: {symbol: fromCrypto.symbol, price: fromPrice},
            toToken: {symbol: toCrypto.symbol, price: toPrice},
            exchangeRate,
            exchangedAmount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// // Historial de Transacciones
// router.get('/transactions', auth, async (req, res) => {
//     try {
//         const transactions = await Transaction.find({user: req.user.id}).sort({date: -1});
//         res.json(transactions);
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });
router.get('/', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({user: req.user.id}).sort({date: -1});
        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Confirmar intercambio y registrar transacción
router.post('/confirm', auth, async (req, res) => {
    const {fromToken, toToken, amount, exchangedAmount} = req.body;
    console.log(req.body);

    try {
        let fromCryptoDB, toCryptoDB;

        // Si el token no es 'EUR', buscar en la base de datos
        if (fromToken !== 'EUR') {
            fromCryptoDB = await Crypto.findOne({user: req.user.id, uid: fromToken});
            console.log(fromCryptoDB);
        }

        if (toToken !== 'EUR') {
            toCryptoDB = await Crypto.findOne({user: req.user.id, uid: toToken});
            console.log(toCryptoDB);
        }

        // Si el token no es 'EUR' y no se encontró en la base de datos, devolver un error
        if ((fromToken !== 'EUR' && !fromCryptoDB) || (toToken !== 'EUR' && !toCryptoDB)) {
            return res.status(404).json({msg: 'Cryptocurrency not found in user portfolio'});
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
            hashExists = await Transaction.findOne({hash});
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
    const {address, symbol, type, startDate, endDate} = req.query;
    const filter = {};

    try {
        if (address) {
            const user = await User.findOne({publicAddress: address});
            if (user) {
                filter.$or = [{userFrom: user._id}, {userTo: user._id}];
            } else {
                return res.status(404).json({msg: 'User not found'});
            }
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

        const transactions = await Transaction.find(filter)
            .sort({date: -1})
            .populate('userFrom', 'username publicAddress')
            .populate('userTo', 'username publicAddress');

        res.json(transactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.post('/send', auth, async (req, res) => {
    const {uid, name, symbol, amount, receiverAddress} = req.body;

    try {
        // Verificar que el usuario tenga suficiente saldo
        const senderCrypto = await Crypto.findOne({user: req.user.id, uid});
        if (!senderCrypto || senderCrypto.amount < amount) {
            return res.status(400).json({msg: 'Insufficient balance'});
        }

        // Restar la cantidad del saldo del remitente
        senderCrypto.amount -= amount;
        await senderCrypto.save();

        // Buscar el usuario receptor por su dirección pública
        const receiver = await User.findOne({publicAddress: receiverAddress});
        if (!receiver) {
            return res.status(404).json({msg: 'Receiver not found'});
        }

        // Buscar si el receptor ya tiene el token en su portafolio
        let receiverCrypto = await Crypto.findOne({user: receiver._id, uid});
        if (receiverCrypto) {
            // Si el receptor ya tiene el token, sumar la cantidad
            receiverCrypto.amount += amount;
        } else {
            // Si el receptor no tiene el token, crear un nuevo registro
            receiverCrypto = new Crypto({
                user: receiver._id,
                uid,
                name,
                symbol,
                amount
            });
        }
        await receiverCrypto.save();

        // Generar un hash único para la transacción
        let hash;
        let hashExists = true;
        while (hashExists) {
            hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
            hashExists = await Transaction.findOne({hash});
        }

        // Registrar la transacción
        const transaction = new Transaction({
            hash: hash,
            userFrom: req.user.id,
            userTo: receiver._id,
            symbol: symbol,
            toToken: symbol,
            amount: amount,
            type: 'send'
        });
        await transaction.save();

        res.json({msg: 'Transaction successful'});
    } catch (err) {
        console.error('Failed to send token', err);
        res.status(500).json({msg: 'Server error'});
    }
});
module.exports = router;