const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, ref: 'Account' },
    type: { type: String, enum: ['FD', 'RD'], required: true },
    principalAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // e.g., 6.5
    startDate: { type: Date, default: Date.now },
    issueDate: { type: Date, default: Date.now }, // Explicit Issue Date
    maturityDate: { type: Date, required: true },
    maturityAmount: { type: Number, required: true },
    transactionId: { type: String }, // Linked Transaction ID
    status: { type: String, enum: ['Active', 'Closed', 'Matured'], default: 'Active' },

    // For RD
    monthlyInstallment: { type: Number },
    installmentsPaid: { type: Number, default: 0 },
    totalInstallments: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Investment', InvestmentSchema);
