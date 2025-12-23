const mongoose = require('mongoose');

const BeneficiarySchema = new mongoose.Schema({
    ownerId: { type: String, required: true }, // Account Number of the user who added this payee
    payeeName: { type: String, required: true },
    payeeAccountNum: { type: String, required: true },
    ifsc: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'ACTIVE'], default: 'PENDING' },

    // Limits & Security
    dailyLimit: { type: Number, default: 100000 },
    transferCountToday: { type: Number, default: 0 },

    // Cooling Period
    activationTime: { type: Date, required: true }, // When it becomes active
    addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Beneficiary', BeneficiarySchema);
