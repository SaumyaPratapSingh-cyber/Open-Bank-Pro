const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true },
    fromAccount: { type: String, required: true, ref: 'Account' },
    toAccount: { type: String, required: true, ref: 'Account' },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    type: {
        type: String,
        enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'UPI', 'LOAN_DISBURSAL', 'LOAN_REPAYMENT', 'INVESTMENT_DEBIT', 'INVESTMENT_CREDIT', 'INVESTMENT_WITHDRAWAL', 'INVESTMENT_BREAK', 'FOREX'],
        default: 'TRANSFER'
    },
    runningBalance: { type: Number }, // Balance AFTER this transaction
    description: { type: String },
    refNo: { type: String } // Reference Number (e.g., UTR)
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);