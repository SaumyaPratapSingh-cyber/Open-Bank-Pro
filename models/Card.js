const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true }, // Links to Account
    cardNumber: { type: String, unique: true, required: true }, // 16 Digits
    cvv: { type: String, required: true, default: '123' },
    expiryDate: { type: String, required: true, default: '12/30' },
    cardType: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    network: { type: String, enum: ['VISA', 'MASTERCARD', 'RUPAY'], default: 'VISA' },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED', 'EXPIRED', 'REQUESTED'], default: 'ACTIVE' },
    isFrozen: { type: Boolean, default: false }, // Module 4
    pin: { type: String }, // Encrypted PIN
    limit: { type: Number, default: 50000 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Card', CardSchema);
