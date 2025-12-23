const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
    accountNumber: { type: String, required: true, ref: 'Account' },
    loanId: { type: String, unique: true, required: true },
    loanType: { type: String, enum: ['Personal', 'Home', 'Education', 'Car'], default: 'Personal' },
    amount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    interestRate: { type: Number, required: true }, // Annual
    emiAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['Pending', 'Active', 'Rejected', 'Closed'], default: 'Pending' },

    documents: [{ type: String }], // Income Proof

    amortizationSchedule: [{
        installmentNo: Number,
        dueDate: Date,
        emi: Number,
        interest: Number,
        principal: Number,
        balance: Number,
        status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Loan', LoanSchema);
