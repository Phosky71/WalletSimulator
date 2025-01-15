const express = require('express');
const {check, validationResult} = require('express-validator');
const auth = require('../routes/authRoutes.js');
const Crypto = require('../models/Cripto');
const Transaction = require('../models/Transaction');
const User = require('../models/Users');
const router = express.Router();
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');


// Agregar Criptomonedas al Portafolio del Usuario
router.post('/',
    auth,
    [
        check('uid', 'UID is required').not().isEmpty(),
        check('name', 'Name is required').not().isEmpty(),
        check('symbol', 'Symbol is required').not().isEmpty(),
        check('amount', 'Amount is required').isNumeric(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({errors: errors.array()});
        }

        const {uid, name, symbol, amount} = req.body;

        try {
            let crypto = new Crypto({
                user: req.user.id,
                uid,
                name,
                symbol,
                amount
            });

            await crypto.save();
            res.status(201).json(crypto);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Visualizar el Portafolio de Criptomonedas
router.get('/', auth, async (req, res) => {
    try {
        const cryptos = await Crypto.find({user: req.user.id});
        res.json(cryptos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


router.get('/cryptocurrencies', auth, async (req, res) => {
    try {
        const token = req.headers['authorization'].split(' ')[1];
        const response = await axios.get('https://api.coinranking.com/v2/coins', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            const coins = response.data.data.coins.map(coin => ({
                name: coin.name,
                symbol: coin.symbol,
                uid: coin.uuid
            }));
            res.json(coins);
        } else {
            res.status(500).json({msg: 'Failed to fetch cryptocurrencies'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

router.get('/cryptocurrencies/:uid', auth, async (req, res) => {
    const {uid} = req.params;
    const token = req.headers['authorization'].split(' ')[1];

    try {
        const response = await axios.get(`https://api.coinranking.com/v2/coin/${uid}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            const coin = response.data.data.coin;
            res.json({
                name: coin.name,
                symbol: coin.symbol,
                uid: coin.uuid,
                price: coin.price
            });
        } else {
            res.status(500).json({msg: 'Failed to fetch cryptocurrency'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

router.post('/cryptocurrencies', auth, async (req, res) => {
    const {uid} = req.body;
    const token = req.headers['authorization'].split(' ')[1];


    try {
        const response = await axios.get('https://api.coinranking.com/v2/coin/' + uid, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 200) {
            const coin = response.data.data.coin;
            res.json({
                name: coin.name,
                symbol: coin.symbol,
                uid: coin.uuid,
                price: coin.price
            });
        } else {
            res.status(500).json({msg: 'Failed to fetch cryptocurrency'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({msg: 'Server Error'});
    }
});

// Enviar tokens entre usuarios
router.post('/send', auth, [
    check('symbol', 'Symbol is required').not().isEmpty(),
    check('amount', 'Amount is required').isNumeric(),
    check('receiverAddress', 'Receiver address is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { symbol, amount, receiverAddress } = req.body;

    try {
        const session = await Crypto.startSession();
        session.startTransaction();

        const senderCrypto = await Crypto.findOne({ user: req.user.id, symbol }).session(session);
        if (!senderCrypto || senderCrypto.amount < amount) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(400).json({ msg: 'Insufficient funds or cryptocurrency not found' });
        }

        const receiverUser = await User.findOne({ publicAddress: receiverAddress }).session(session);
        if (!receiverUser) {
            await session.abortTransaction();
            await session.endSession();
            return res.status(404).json({ msg: 'Receiver not found' });
        }

        let receiverCrypto = await Crypto.findOne({ user: receiverUser.id, symbol }).session(session);
        if (!receiverCrypto) {
            receiverCrypto = new Crypto({
                user: receiverUser.id,
                symbol,
                amount: 0
            });
        }

        senderCrypto.amount -= amount;
        receiverCrypto.amount += amount;

        await senderCrypto.save({ session });
        await receiverCrypto.save({ session });

        // Verificar si el receptor tiene habilitada la opción autoAddCrypto
        if (receiverUser.settings.autoAddCrypto) {
            await receiverCrypto.save({ session });
        }

        // Generar un hash único
        let hash;
        let hashExists = true;
        while (hashExists) {
            hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
            hashExists = await Transaction.findOne({ hash }).session(session);
        }

        const transaction = new Transaction({
            hash,
            userFrom: req.user.id,
            userTo: receiverUser.id,
            symbol,
            toToken: 'SEND',
            fromAmount: amount,
            toAmount: amount,
            type: 'send'
        });

        await transaction.save({ session });

        await session.commitTransaction();
        await session.endSession();

        res.json({ msg: 'Transaction successful', transaction });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

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
//
// router.post('/confirm-exchange', auth, async (req, res) => {
//     const {fromToken, toToken, amount, exchangedAmount} = req.body;
//     console.log(req.body);
//
//     try {
//         let fromCryptoDB, toCryptoDB;
//
//         // Si el token no es 'EUR', buscar en la base de datos
//         if (fromToken !== 'EUR') {
//             fromCryptoDB = await Crypto.findOne({user: req.user.id, uid: fromToken});
//             console.log(fromCryptoDB);
//         }
//
//         if (toToken !== 'EUR') {
//             toCryptoDB = await Crypto.findOne({user: req.user.id, uid: toToken});
//             console.log(toCryptoDB);
//         }
//
//         // Si el token no es 'EUR' y no se encontró en la base de datos, devolver un error
//         if ((fromToken !== 'EUR' && !fromCryptoDB) || (toToken !== 'EUR' && !toCryptoDB)) {
//             return res.status(404).json({msg: 'Cryptocurrency not found in user portfolio'});
//         }
//
//         // Si el token no es 'EUR', actualizar la cantidad en la base de datos
//         if (fromToken !== 'EUR') {
//             fromCryptoDB.amount -= amount;
//             await fromCryptoDB.save();
//         }
//
//         if (toToken !== 'EUR') {
//             toCryptoDB.amount += exchangedAmount;
//             await toCryptoDB.save();
//         }
//
//         // Generar un hash único
//         let hash;
//         let hashExists = true;
//         while (hashExists) {
//             hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
//             hashExists = await Transaction.findOne({hash});
//         }
//
//         // Registrar la transacción
//         const transaction = new Transaction({
//             hash: hash,
//             userFrom: req.user.id,
//             userTo: req.user.id, // Ajuste para userTo
//             symbol: fromToken,
//             toToken: toToken,
//             amount: amount,
//             type: 'exchange'
//         });
//
//         await transaction.save();
//
//         res.json({
//             fromToken: fromCryptoDB,
//             toToken: toCryptoDB,
//             msg: 'Exchange confirmed and transaction recorded'
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });

// router.post('/confirm-exchange', auth, async (req, res) => {
//     const {fromToken, toToken, amount, exchangedAmount} = req.body;
//     console.log(req.body);
//
//     try {
//         // Actualizar las cantidades en la base de datos
//         const fromCryptoDB = await Crypto.findOne({user: req.user.id, uid: fromToken});
//         console.log(fromCryptoDB);
//         const toCryptoDB = await Crypto.findOne({user: req.user.id, uid: toToken});
//         console.log(toCryptoDB);
//
//         if (!fromCryptoDB || !toCryptoDB) {
//             return res.status(404).json({msg: 'Cryptocurrency not found in user portfolio'});
//         }
//
//         fromCryptoDB.amount -= amount;
//         toCryptoDB.amount += exchangedAmount;
//
//         await fromCryptoDB.save();
//         await toCryptoDB.save();
//
//         res.json({
//             fromToken: fromCryptoDB,
//             toToken: toCryptoDB
//         });
//     } catch (err) {
//         console.error(err.message);
//         res.status(500).send('Server Error');
//     }
// });


module.exports = router;