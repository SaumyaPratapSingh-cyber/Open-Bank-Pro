const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Account Number
    transactionId: { type: String }, // Optional, if linked to a specific tx
    issueType: { type: String, enum: ['TRANSACTION_FAILURE', 'FRAUD', 'BILLING', 'OTHER'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'REJECTED'], default: 'OPEN' },
    adminResponse: { type: String },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date }
});

module.exports = mongoose.model('Ticket', TicketSchema);
