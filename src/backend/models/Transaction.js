const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true
    },
    userFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        required: function () {
            return this.type === 'send' || this.type === 'exchange';
        }
    },
    toAmount: {
        type: Number,
        required: function () {
            return this.type === 'send' || this.type === 'exchange';
        }
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