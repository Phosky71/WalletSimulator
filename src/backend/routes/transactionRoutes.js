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
// transactionRoutes.js
router.get('/user-transactions', auth, async (req, res) => {
    const {filterType, filterValue} = req.query;
    let filter = {};

    try {
        if (filterType && filterValue) {
            switch (filterType) {
                case 'hash':
                    filter.hash = filterValue;
                    break;
                case 'userFrom':
                    const userFrom = await User.findOne({publicAddress: filterValue});
                    if (!userFrom) return res.status(404).json({msg: 'User From not found'});
                    filter.userFrom = userFrom._id;
                    break;
                case 'userTo':
                    const userTo = await User.findOne({publicAddress: filterValue});
                    if (!userTo) return res.status(404).json({msg: 'User not found'});
                    filter.userTo = userTo._id;
                    break;
                case 'symbol':
                    filter.symbol = filterValue;
                    break;
                case 'toToken':
                    filter.toToken = filterValue;
                    break;
                case 'fromAmount':
                    filter.fromAmount = parseFloat(filterValue);
                    break;
                case 'toAmount':
                    filter.toAmount = parseFloat(filterValue);
                    break;
                case 'date':
                    const dateStart = new Date(filterValue);
                    const dateEnd = new Date(filterValue);
                    dateEnd.setHours(23, 59, 59, 999);
                    filter.date = {$gte: dateStart, $lte: dateEnd};
                    break;
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
    const numericAmount = parseFloat(amount); // Convertir el monto a número

    try {
        // Verificar que el remitente tenga suficiente saldo
        const senderCrypto = await Crypto.findOneAndUpdate(
            {user: req.user.id, uid, amount: {$gte: numericAmount}},
            {$inc: {amount: -numericAmount}}, // Restar saldo del remitente
            {new: true}
        );

        if (!senderCrypto) {
            return res.status(400).json({msg: 'Insufficient balance or token not found'});
        }

        // Buscar al receptor por su dirección pública
        const receiver = await User.findOne({publicAddress: receiverAddress});
        if (!receiver) {
            // Revertir saldo del remitente si no se encuentra el receptor
            await Crypto.findOneAndUpdate(
                {user: req.user.id, uid},
                {$inc: {amount: numericAmount}} // Revertir deducción del saldo
            );
            return res.status(404).json({msg: 'Receiver not found'});
        }

        // Actualizar o crear el saldo del receptor
        let receiverCrypto = await Crypto.findOneAndUpdate(
            {user: receiver._id, uid},
            {$inc: {amount: numericAmount}}, // Sumar saldo al receptor
            {new: true}
        );

        if (!receiverCrypto) {
            receiverCrypto = new Crypto({
                user: receiver._id,
                uid,
                name,
                symbol,
                amount: numericAmount
            });
            await receiverCrypto.save();
        }

        // Generar un hash único para la transacción
        let hash;
        let hashExists = true;
        while (hashExists) {
            hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
            hashExists = await Transaction.findOne({hash});
        }

        // Registrar la transacción como 'send'
        const transaction = new Transaction({
            hash,
            userFrom: req.user.id,
            userTo: receiver._id,
            symbol,
            fromAmount: numericAmount, // Obligatorio según tu modelo
            toAmount: numericAmount,   // Obligatorio según tu modelo
            type: 'send'               // Siempre será 'send' en esta función
        });

        await transaction.save();

        res.json({msg: 'Transaction successful'});

    } catch (err) {
        console.error('Failed to send token', err);
        res.status(500).json({msg: 'Server error'});
    }
});

// router.post('/send', auth, async (req, res) => {
//     const {uid, name, symbol, amount, receiverAddress} = req.body;
//
//     console.log('Datos recibidos:', req.body); // Verificar que los datos estén llegando correctamente
//
//     try {
//         // Verificar que el usuario tenga suficiente saldo
//         const senderCrypto = await Crypto.findOne({user: req.user.id, uid});
//         console.log('Saldo del remitente:', senderCrypto); // Verificar que el remitente tenga el token
//
//         if (!senderCrypto || senderCrypto.amount < amount) {
//             console.log('Insufficient balance or token not found');
//             return res.status(400).json({msg: 'Insufficient balance'});
//         }
//
//         // Intentar actualizar el saldo del remitente
//         const updatedSenderCrypto = await Crypto.findOneAndUpdate(
//             {user: req.user.id, uid, amount: senderCrypto.amount},
//             {$inc: {amount: -amount}},
//             {new: true}
//         );
//
//         if (!updatedSenderCrypto) {
//             // Si no se actualizó, significa que alguien más actualizó el saldo mientras tanto
//             // Volver a intentarlo
//             return res.status(409).json({msg: 'Concurrent update detected. Please try again.'});
//         }
//         console.log('Saldo del remitente actualizado:', updatedSenderCrypto.amount);
//
//         // Buscar el usuario receptor por su dirección pública
//         const receiver = await User.findOne({publicAddress: receiverAddress});
//         console.log('Receptor encontrado:', receiver); // Verificar que el receptor exista
//
//         if (!receiver) {
//             console.log('Receiver not found');
//             return res.status(404).json({msg: 'Receiver not found'});
//         }
//
//         // Buscar si el receptor ya tiene el token en su portafolio
//         let receiverCrypto = await Crypto.findOne({user: receiver._id, uid});
//         console.log('Token del receptor:', receiverCrypto); // Verificar si el receptor ya tiene el token
//
//         if (receiverCrypto) {
//             // Intentar actualizar el saldo del receptor
//             const updatedReceiverCrypto = await Crypto.findOneAndUpdate(
//                 {user: receiver._id, uid, amount: receiverCrypto.amount},
//                 {$inc: {amount: amount}},
//                 {new: true}
//             );
//
//             if (!updatedReceiverCrypto) {
//                 // Si no se actualizó, significa que alguien más actualizó el saldo mientras tanto
//                 // Volver a intentarlo
//                 return res.status(409).json({msg: 'Concurrent update detected. Please try again.'});
//             }
//             receiverCrypto = updatedReceiverCrypto;
//         } else {
//             // Si el receptor no tiene el token, crear un nuevo registro
//             receiverCrypto = new Crypto({
//                 user: receiver._id,
//                 uid,
//                 name,
//                 symbol,
//                 amount: parseFloat(amount)
//             });
//             await receiverCrypto.save();
//         }
//         console.log('Saldo del receptor actualizado:', receiverCrypto.amount);
//
//         // Generar un hash único para la transacción
//         let hash;
//         let hashExists = true;
//         while (hashExists) {
//             hash = crypto.createHash('sha256').update(Date.now().toString() + req.user.id).digest('hex');
//             hashExists = await Transaction.findOne({hash});
//             console.log('Hash generado:', hash); // Verificar que el hash sea único
//         }
//
//         // Registrar la transacción
//         const transaction = new Transaction({
//             hash: hash,
//             userFrom: req.user.id,
//             userTo: receiver._id,
//             symbol: symbol,
//             toToken: symbol,
//             amount: amount,
//             type: 'send'
//         });
//         await transaction.save();
//         console.log('Transacción registrada:', transaction);
//
//         res.json({msg: 'Transaction successful'});
//     } catch (err) {
//         console.error('Failed to send token', err);
//         res.status(500).json({msg: 'Server error'});
//     }
// });


module.exports = router;