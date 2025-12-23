const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientAccount: { type: String, required: true, ref: 'Account' }, // Account Number
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['INFO', 'ALERT', 'SUCCESS', 'WARNING'], default: 'INFO' },
    isRead: { type: Boolean, default: false },
    actionLink: { type: String }, // Optional link to redirect user
    sender: { type: String, default: 'System' } // 'System' or 'Admin'
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
