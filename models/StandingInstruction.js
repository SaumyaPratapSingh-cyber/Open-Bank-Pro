const mongoose = require('mongoose');

const StandingInstructionSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Account Number
    payeeAccount: { type: String, required: true },
    payeeName: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ['MONTHLY'], default: 'MONTHLY' },
    dayOfMonth: { type: Number, required: true, min: 1, max: 28 }, // Safe cap for all months
    nextExecutionDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
    lastExecuted: { type: Date },
    failureReason: { type: String }, // If last attempt failed
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StandingInstruction', StandingInstructionSchema);
