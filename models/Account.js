const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    // Security & ID
    accountNumber: { type: String, unique: true, required: true },
    cifNumber: { type: String, unique: true, sparse: true }, // Customer ID
    password: { type: String, required: true }, // New: Encrypted Password

    // Password Reset
    resetOTP: { type: String },
    resetExpires: { type: Date },

    // Personal Details (KYC)
    ownerName: { type: String, required: true },
    fatherName: { type: String },
    dob: { type: Date }, // We calculate age from this
    gender: { type: String },

    // Contact Info
    email: { type: String, unique: true, required: true },
    mobile: { type: String, required: true },
    address: { type: String },

    // Account Details
    accountType: { type: String, default: 'Savings' }, // Savings or Current
    balances: {
        INR: { type: Number, default: 0 },
        USD: { type: Number, default: 0 },
        EUR: { type: Number, default: 0 }
    }, // Replaces single 'balance' field

    // DEPRECATED: Kept for migration
    balance: { type: Number, select: true },

    // New Features (Core Banking Upgrade)
    upiIds: [{ type: String }], // Array of VPAs
    upiPin: { type: String }, // Hashed UPI PIN
    // New Features (Core Banking Upgrade)
    upiIds: [{ type: String }], // Array of VPAs
    upiPin: { type: String }, // Hashed UPI PIN
    // upiId (singular) removed as it was duplicate/deprecated by upiIds

    // --- ADMIN / BACK OFFICE FIELDS ---
    role: { type: String, enum: ['CUSTOMER', 'ADMIN', 'MANAGER'], default: 'CUSTOMER' },

    kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'FROZEN'], default: 'PENDING' },

    riskRating: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },

    documents: [{
        docType: { type: String, enum: ['AADHAR', 'PAN'] },
        url: String,
        status: { type: String, default: 'PENDING' } // PENDING, VERIFIED, REJECTED
    }],

    // Visuals
    profileImage: { type: String }, // We will store the image as a Base64 string

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', AccountSchema);