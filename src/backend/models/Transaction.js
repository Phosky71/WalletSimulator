const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true
    },
    userFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    userTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: function () {
            return this.type === 'send';
        }
    },
    symbol: {
        type: String,
        required: true
    },
    toToken: {
        type: String,
        required: function () {
            return this.type === 'exchange';
        }
    },
    fromAmount: {
        type: Number,
        required: true
    },
    toAmount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['send', 'exchange'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('transaction', TransactionSchema);

//TODO puedes hacer que en el historial de transacciones en vez del adress salga el nombre de usuario y cauando pases por encima de un nombre de usuario salga un tooltip que diga "Pulsa para copiar publicAddress" y cuando pulses se copie a tú portapapeles el address público