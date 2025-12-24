require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For password encryption
const jwt = require('jsonwebtoken'); // For secure login
const { v4: uuidv4 } = require('uuid');

// --- IMPORT MODELS ---
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');
const Investment = require('./models/Investment');
const Loan = require('./models/Loan');
const Notification = require('./models/Notification');
const Card = require('./models/Card');
const Beneficiary = require('./models/Beneficiary');
const StandingInstruction = require('./models/StandingInstruction');
const Ticket = require('./models/Ticket');
const cron = require('node-cron');
const { sendWelcomeEmail, sendLoginAlert, sendOTP, sendTicketResolvedEmail, sendAdminMessageEmail } = require('./utils/emailService');

const app = express();

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); // Increased limit for Image Uploads
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123'; // In production, keep this hidden

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected (Pro Version)"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// 1. Activate Beneficiaries (Every Minute)
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const result = await Beneficiary.updateMany(
            { status: 'PENDING', activationTime: { $lte: now } },
            { status: 'ACTIVE' }
        );
        // Silent success
    } catch (err) {
        console.error("[CRON] Beneficiary Activation Failed:", err);
    }
});

// 2. Auto-Pay Execution (Daily at 00:00)
// For Sandbox/Demo: Running every 5 minutes if nextExecutionDate matches today to allow testing
cron.schedule('*/5 * * * *', async () => {
    console.log("Running Auto-Pay Cron...");
    const session = await mongoose.startSession();
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find due instructions
        const instructions = await StandingInstruction.find({
            status: 'ACTIVE',
            nextExecutionDate: { $lte: new Date() } // Catch up on past due too
        });

        console.log(`Found ${instructions.length} due payments.`);

        for (const instr of instructions) {
            try {
                session.startTransaction();

                const sender = await Account.findOne({ accountNumber: instr.userId }).session(session);
                const receiver = await Account.findOne({ accountNumber: instr.payeeAccount }).session(session);

                if (!sender || !receiver) throw new Error("Account not found");
                if (sender.balances.INR < instr.amount) throw new Error("Insufficient Funds");

                // Execute Transfer
                sender.balances.INR -= instr.amount;
                receiver.balances.INR += instr.amount;

                await sender.save({ session });
                await receiver.save({ session });

                await Transaction.create([{
                    transactionId: uuidv4(),
                    fromAccount: instr.userId,
                    toAccount: instr.payeeAccount,
                    amount: instr.amount,
                    type: 'AUTO_PAY',
                    status: 'SUCCESS',
                    description: `Auto-Pay to ${instr.payeeName}`,
                    refNo: 'SI-' + Math.floor(Math.random() * 1000000),
                    runningBalance: sender.balances.INR
                }], { session });

                // Update Next Date
                const nextDate = new Date(instr.nextExecutionDate);
                nextDate.setMonth(nextDate.getMonth() + 1); // Add 1 month

                instr.nextExecutionDate = nextDate;
                instr.lastExecuted = new Date();
                instr.failureReason = null;
                await instr.save({ session });

                await session.commitTransaction();
                console.log(`Auto-Pay ${instr._id} Success.`);

            } catch (txError) {
                await session.abortTransaction();
                console.error(`Auto-Pay ${instr._id} Failed: ${txError.message}`);
                instr.failureReason = txError.message;
                // Retry tomorrow? Or just leave it? For now, leave date as is to retry next run?
                // Or skip to next month? Usually retry.
                // For demo simplicity, we won't advance date if failed, so it retries.
                await instr.save();
            }
        }
    } catch (err) {
        console.error("Auto-Pay Job Error:", err);
    } finally {
        session.endSession();
    }
});

// ==========================
// 🏦 AUTHENTICATION ROUTES
// ==========================

// 1. REGISTER (Create New Account)
app.post('/api/register', async (req, res) => {
    try {
        const { ownerName, fatherName, email, mobile, address, password, dob, gender, profileImage } = req.body;

        // Validation
        if (!email || !password || !ownerName) return res.status(400).json({ error: "Required fields missing" });

        // Check if email exists
        const existingUser = await Account.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });

        // Generate Account Number
        const newAcctNum = Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 Digits

        // Encrypt Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        // HARDCODED ADMIN ACCESS
        const role = email === 'saumyrajpoot666@gmail.com' ? 'ADMIN' : 'CUSTOMER';

        // Generate CIF and UPI
        const cifNumber = 'CIF' + Math.floor(10000000 + Math.random() * 90000000);
        const upiId = `${mobile}@openbank`;

        const newAccount = await Account.create({
            accountNumber: newAcctNum,
            password: hashedPassword,
            ownerName, fatherName, email, mobile, address, dob, gender,
            profileImage,
            role,
            balances: { INR: 1000, USD: 0, EUR: 0 }, // Free ₹1000 Bonus
            cifNumber,
            upiId
        });

        // Issue Default Debit Card - REMOVED TO COMPLY WITH VIRTUAL CARD MODULE
        // Cards are now requested manually by the user from the dashboard.
        // await Card.create({...});

        // Record Initial Deposit
        await Transaction.create({
            transactionId: uuidv4(),
            fromAccount: 'MINT', toAccount: newAcctNum, amount: 1000, type: 'DEPOSIT', status: 'SUCCESS'
        });

        // Send Welcome Email (Async - don't wait for it)
        sendWelcomeEmail({ ownerName, email, accountNumber: newAcctNum, cifNumber }).catch(err => console.error("Email Error:", err.message));

        res.status(201).json({ message: "Registration Successful", accountNumber: newAcctNum });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. LOGIN (Verify Password)
app.post('/api/login', async (req, res) => {
    try {
        const { accountNumber, password } = req.body;

        const user = await Account.findOne({ accountNumber });
        if (!user) return res.status(404).json({ error: "Account not found" });

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid Credentials" });

        // Send Login Alert (Async)
        sendLoginAlert(user).catch(err => console.error("Email Error:", err.message));

        // Create Token
        const token = jwt.sign({ id: user.accountNumber }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                accountNumber: user.accountNumber,
                ownerName: user.ownerName,
                role: user.role, // Send Role to Frontend
                balances: user.balances
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. FORGOT PASSWORD - INIT (Send OTP)
app.post('/api/auth/forgot-password-init', async (req, res) => {
    try {
        const { accountNumber, mobile, email } = req.body;

        // Verify User
        const user = await Account.findOne({ accountNumber });
        if (!user) return res.status(404).json({ error: "Account not found" });

        // Verify Contact Details (Check Mobile OR Email)
        if (mobile && user.mobile !== mobile) return res.status(400).json({ error: "Mobile number does not match our records" });
        if (email && user.email !== email) return res.status(400).json({ error: "Email does not match our records" });

        // If neither provided
        if (!mobile && !email) return res.status(400).json({ error: "Please provide registered Mobile or Email" });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes

        // Save to DB
        user.resetOTP = otp;
        user.resetExpires = expires;
        await user.save();

        // Send OTP via Email (Primary)
        await sendOTP(user.email, otp).catch(err => console.error("Email OTP Failed:", err));

        // Send OTP via SMS (Optional / Fallback) - If credentials exist
        try {
            // Only try SMS if mobile provided and service exists
            const { sendSMS } = require('./utils/smsService');
            await sendSMS(user.mobile, `Your OpenBank OTP for Password Reset is: ${otp}. Valid for 10 mins.`);
        } catch (smsErr) {
            console.log("SMS Service Skipped/Failed:", smsErr.message);
        }

        res.json({ message: `OTP sent to your registered Email (${user.email}) and Mobile.` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. FORGOT PASSWORD - RESET (Verify OTP & Update Password)
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { accountNumber, otp, newPassword } = req.body;

        const user = await Account.findOne({ accountNumber });
        if (!user) return res.status(404).json({ error: "Account not found" });

        // Check OTP
        if (!user.resetOTP || user.resetOTP !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // Check Expiry
        if (user.resetExpires < new Date()) {
            return res.status(400).json({ error: "OTP Expired. Please try again." });
        }

        // Hash New Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear OTP
        user.resetOTP = undefined;
        user.resetExpires = undefined;

        await user.save();

        res.json({ message: "Password Reset Successful! You can now login." });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 🛡️ MIDDLEWARE
// ==========================
const verifyToken = (req, res, next) => {
    let token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: "Access Denied" });

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid Token" });
    }
};

const verifyAdmin = async (req, res, next) => {
    try {
        const user = await Account.findOne({ accountNumber: req.user.id });
        if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
            return res.status(403).json({ error: "Access Denied: Admins Only" });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Server Error during Admin check" });
    }
};

// ==========================
// 🏛️ ADMIN ROUTES
// ==========================

// A. Get KYC Queue
app.get('/api/admin/kyc-queue', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const pendingUsers = await Account.find({ kycStatus: 'PENDING' });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// B. KYC Action (Verify/Reject)
app.post('/api/admin/kyc-action', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { accountNumber, status, riskRating } = req.body; // status: VERIFIED | REJECTED

        const updateData = { kycStatus: status };
        if (riskRating) updateData.riskRating = riskRating;

        const updatedUser = await Account.findOneAndUpdate(
            { accountNumber },
            updateData,
            { new: true }
        );
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// C. Audit Transactions (AML Monitor)
app.get('/api/admin/audit-transactions', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Fetch recent 50 transactions for Live Monitor (No Amount Filter)
        const recentTransactions = await Transaction.find({})
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(recentTransactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// D. Freeze Account
app.post('/api/admin/freeze-account', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { accountNumber } = req.body;
        const frozenUser = await Account.findOneAndUpdate(
            { accountNumber },
            { kycStatus: 'FROZEN', riskRating: 'HIGH' },
            { new: true }
        );
        res.json({ message: `Account ${accountNumber} has been FROZEN.`, user: frozenUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// E. Change User Role (Promote/Demote)
app.post('/api/admin/change-role', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { accountNumber, newRole } = req.body;
        if (!['ADMIN', 'MANAGER', 'CUSTOMER'].includes(newRole)) {
            return res.status(400).json({ error: "Invalid Role" });
        }

        const updatedUser = await Account.findOneAndUpdate(
            { accountNumber },
            { role: newRole },
            { new: true }
        );
        res.json({ message: `Role updated to ${newRole}`, user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// F. Get All Customers (Directory)
app.get('/api/admin/customers', verifyToken, verifyAdmin, async (req, res) => {
    try {
        console.log("Fetching all customers for Admin Directory...");
        const customers = await Account.find({}).select('-password').sort({ createdAt: -1 });
        console.log(`Found ${customers.length} customers.`);
        res.json(customers);
    } catch (error) {
        console.error("Admin Directory Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// G. Send Notification (Message Customer)
app.post('/api/admin/notify', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { accountNumber, title, message, type } = req.body;

        const newNotif = await Notification.create({
            recipientAccount: accountNumber,
            title,
            message,
            type: type || 'INFO',
            sender: 'Admin'
        });

        // Send Email (Fire-and-Forget)
        const user = await Account.findOne({ accountNumber });
        if (user) {
            sendAdminMessageEmail(user, title, message, type || 'INFO').catch(err => console.error("Admin Msg Email Failed:", err.message));
        }

        res.json(newNotif);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// G2. Resend Welcome Email (For Old Customers)
app.post('/api/admin/resend-welcome', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { accountNumber } = req.body;
        const user = await Account.findOne({ accountNumber });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Ensure CIF exists (Legacy Support)
        if (!user.cifNumber) {
            user.cifNumber = 'CIF' + Math.floor(10000000 + Math.random() * 90000000);
            await user.save();
        }

        // Send Email
        // Send Email (Fire-and-Forget)
        sendWelcomeEmail(user).catch(err => console.error("Resend Welcome Failed:", err.message));

        res.json({ message: `Welcome Email Resent to ${user.email}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DEBUG: Test Email Connection
app.get('/api/admin/debug-email', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const nodemailer = require('nodemailer');
        // Check Vars
        const userSet = !!process.env.EMAIL_USER;
        const passSet = !!process.env.EMAIL_PASS;

        // Manual Transport for Test
        const testTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000
        });

        // Verify
        await testTransporter.verify();

        res.json({
            status: "SUCCESS",
            env: { user: userSet, pass: passSet },
            message: "SMTP Connection Verified. Credentials are correct."
        });
    } catch (error) {
        res.status(500).json({
            status: "FAILED",
            error: error.message,
            stack: error.stack,
            env: {
                user: !!process.env.EMAIL_USER,
                pass: !!process.env.EMAIL_PASS
            }
        });
    }
});

// H. Admin Dashboard Stats (Headquarters)
app.get('/api/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await Account.countDocuments({ role: 'CUSTOMER' });
        const recentUsers = await Account.countDocuments({ createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });

        // Calculate Total Liquidity (Sum of all customer balances)
        const liquidityResult = await Account.aggregate([
            { $match: { role: 'CUSTOMER' } },
            { $group: { _id: null, total: { $sum: "$balances.INR" } } }
        ]);
        const totalLiquidity = liquidityResult[0]?.total || 0;

        const pendingKyc = await Account.countDocuments({ kycStatus: 'PENDING' });

        // Transaction Volume (Today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const txVolumeResult = await Transaction.aggregate([
            { $match: { createdAt: { $gte: startOfDay } } },
            { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
        ]);

        const todayTxVolume = txVolumeResult[0]?.total || 0;
        const todayTxCount = txVolumeResult[0]?.count || 0;

        res.json({
            totalUsers,
            recentUsers,
            totalLiquidity,
            pendingKyc,
            todayTxVolume,
            todayTxCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 🏦 BANKING ROUTES
// ==========================

// 3.0 Lookup Account (Public/Protected - For Transfers)
app.get('/api/accounts/lookup/:accountNumber', verifyToken, async (req, res) => {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber })
            .select('ownerName upiId upiIds profileImage');

        if (!account) return res.status(404).json({ error: "Account not found" });

        res.json({
            ownerName: account.ownerName,
            upiId: account.upiId, // Return legacy if needed
            profileImage: account.profileImage // Nice to have for UI
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Get Full Profile (Protected)
app.get('/api/accounts/:accountNumber', async (req, res) => {
    try {
        let account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: "Account not found" });

        // Lazy Update for Legacy Users (Add CIF & UPI if missing)
        let needsUpdate = false;
        if (!account.cifNumber) {
            account.cifNumber = 'CIF' + Math.floor(10000000 + Math.random() * 90000000);
            needsUpdate = true;
        }
        if (!account.upiId) {
            account.upiId = `${account.mobile}@openbank`;
            needsUpdate = true;
        }

        // Ensure upiIds array is populated
        if (!account.upiIds || account.upiIds.length === 0) {
            account.upiIds = [account.upiId];
            needsUpdate = true;
        }

        // MIGRATION: Single Balance -> Multi-Currency Balances
        // MIGRATION: Single Balance -> Multi-Currency Balances
        // Force migration if balances missing OR if legacy balance exists and new balance is 0 (failed migration)
        if (!account.balances || (account.balance && account.balance > 0 && account.balances.INR === 0)) {
            console.log(`[MIGRATION] Migrating Account ${account.accountNumber} to Multi-Currency.`);
            const oldBalance = account.balance || 0;
            account.balances = {
                INR: oldBalance,
                USD: 0,
                EUR: 0
            };
            // account.balance = undefined; // Optional: Remove old field
            needsUpdate = true;
        }

        if (needsUpdate) {
            try {
                await account.save();
            } catch (saveError) {
                console.error("Auto-Update Failed (Non-critical):", saveError.message);
                // Continue execution to return the account data anyway
            }
        }

        // Remove password before sending
        const accountData = account.toObject();
        delete accountData.password;

        res.json(accountData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Update Profile
app.put('/api/accounts/:accountNumber', async (req, res) => {
    try {
        const { mobile, address, email, profileImage } = req.body;
        const updated = await Account.findOneAndUpdate(
            { accountNumber: req.params.accountNumber },
            { mobile, address, email, profileImage },
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.05 Get Transactions (Restored)
app.get('/api/accounts/:accountNumber/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [{ fromAccount: req.params.accountNumber }, { toAccount: req.params.accountNumber }]
        }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.1 Get Cards
// 4.1 Get Cards
app.get('/api/accounts/:accountNumber/cards', async (req, res) => {
    try {
        const cards = await Card.find({ accountNumber: req.params.accountNumber });
        const account = await Account.findOne({ accountNumber: req.params.accountNumber }).select('ownerName');

        const enhancedCards = cards.map(card => ({
            ...card.toObject(),
            ownerName: account ? account.ownerName : 'Unknown'
        }));

        res.json(enhancedCards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.1.1 Request New Card (Customer)
app.post('/api/cards/request', async (req, res) => {
    try {
        const { accountNumber, cardType, network, nameOnCard } = req.body;

        const existingRequest = await Card.findOne({ accountNumber, status: 'REQUESTED' });
        if (existingRequest) return res.status(400).json({ error: "You already have a pending card request." });

        const newRequest = await Card.create({
            accountNumber,
            cardType,
            network,
            status: 'REQUESTED',
            nameOnCard, // Add this to schema or just use it for admin view if added to schema, otherwise ignore
            cardNumber: 'PENDING', // Placeholder
            cvv: 'XXX',
            expiryDate: 'XX/XX'
        });

        res.json({ message: "Card Request Submitted Successfully", request: newRequest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.1.2 Get Pending Card Requests (Admin)
app.get('/api/admin/cards/pending', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const requests = await Card.find({ status: 'REQUESTED' });
        // Enhance with Owner Name
        const enhancedRequests = [];
        for (const req of requests) {
            const user = await Account.findOne({ accountNumber: req.accountNumber }).select('ownerName');
            enhancedRequests.push({ ...req.toObject(), ownerName: user ? user.ownerName : 'Unknown' });
        }
        res.json(enhancedRequests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.1.3 Approve Card Request (Admin)
app.post('/api/admin/cards/approve', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { cardId } = req.body;
        const card = await Card.findById(cardId);
        if (!card) return res.status(404).json({ error: "Card request not found" });

        // Generate Details
        const cardNumber = '4' + Math.floor(100000000000000 + Math.random() * 900000000000000).toString(); // Starts with 4 (Visa-like)
        const cvv = Math.floor(100 + Math.random() * 900).toString(); // Fixed Assigned CVV
        const expiryDate = '12/30'; // Fixed for Demo

        card.cardNumber = cardNumber;
        card.cvv = cvv;
        card.expiryDate = expiryDate;
        card.status = 'ACTIVE';
        await card.save();

        // Notify Customer
        await Notification.create({
            recipientAccount: card.accountNumber,
            title: 'Card Request Approved',
            message: `Your new ${card.network} ${card.cardType} Card has been generated. View details in the Cards section.`,
            type: 'SUCCESS',
            sender: 'Admin'
        });

        res.json({ message: "Card Approved & Generated", card });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.1.4 Transfer via Card
app.post('/api/transfers/card', async (req, res) => {
    const { cardNumber, cvv, amount, description, toAccount } = req.body;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Find Card
        const card = await Card.findOne({ cardNumber });
        if (!card) throw new Error("Invalid Card Number");
        if (card.cvv !== cvv) throw new Error("Invalid CVV");
        if (card.status !== 'ACTIVE') throw new Error("Card is not active");

        // Find Sender Account via Card
        const sender = await Account.findOne({ accountNumber: card.accountNumber }).session(session);
        if (!sender) throw new Error("Linked Account Not Found");
        if (sender.balances.INR < amount) throw new Error("Insufficient Funds");

        const receiver = await Account.findOne({ accountNumber: toAccount }).session(session);
        if (!receiver) throw new Error("Receiver Account Not Found");

        // Execute Transfer
        sender.balances.INR -= Number(amount);
        receiver.balances.INR += Number(amount);

        await sender.save({ session });
        await receiver.save({ session });

        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount: sender.accountNumber,
            toAccount: receiver.accountNumber,
            amount,
            status: 'SUCCESS',
            type: 'CARD_PAYMENT',
            description: description || `Card Payment to ${toAccount}`,
            refNo: 'CRD' + Math.floor(Math.random() * 1000000),
            runningBalance: sender.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Card Payment Successful", transactionId: "TXN" });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 4.2 Get Notifications
app.get('/api/accounts/:accountNumber/notifications', async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientAccount: req.params.accountNumber })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.3 Mark Notification Read
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Transfer Money (ACID Transaction)
app.post('/api/transfers', async (req, res) => {
    const { fromAccount, toAccount, amount } = req.body;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        if (amount <= 0) throw new Error("Invalid amount");
        if (fromAccount === toAccount) throw new Error("Cannot self-transfer");

        const sender = await Account.findOne({ accountNumber: fromAccount }).session(session);
        const receiver = await Account.findOne({ accountNumber: toAccount }).session(session);

        if (!sender || !receiver) throw new Error("Invalid account details");
        if (sender.kycStatus !== 'VERIFIED') throw new Error("KYC Pending: Transactions are blocked until verification.");
        if (sender.balances.INR < amount) throw new Error("Insufficient funds (INR)");

        // BENEFICIARY CHECK (Risk Engine)
        const beneficiary = await Beneficiary.findOne({ ownerId: fromAccount, payeeAccountNum: toAccount });
        if (!beneficiary) {
            throw new Error("Recipient is not a saved beneficiary. Please add them first.");
        }
        if (beneficiary.status === 'PENDING') {
            // Calculate remaining time
            const remaining = Math.ceil((new Date(beneficiary.activationTime) - new Date()) / 60000);
            throw new Error(`Beneficiary is in cooling period. Active in ${remaining} mins.`);
        }
        // Limit Check (Simulated Daily Limit)
        if (amount > beneficiary.dailyLimit) {
            throw new Error(`Transfer exceeds daily limit of ₹${beneficiary.dailyLimit} for this payee.`);
        }

        sender.balances.INR -= Number(amount);
        await sender.save({ session });

        receiver.balances.INR += Number(amount);
        await receiver.save({ session });

        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount, toAccount, amount, status: 'SUCCESS', type: 'TRANSFER',
            description: `Transfer to ${toAccount}`,
            refNo: 'TRF' + Math.floor(Math.random() * 1000000),
            runningBalance: sender.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Transfer successful", senderNewBalance: sender.balances });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 6. Deposit Money (For Earn & Invest features)
app.post('/api/deposit', async (req, res) => {
    const { accountNumber, amount, description } = req.body;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        if (amount <= 0) throw new Error("Invalid amount");

        const account = await Account.findOne({ accountNumber }).session(session);
        if (!account) throw new Error("Account not found");

        account.balances.INR += Number(amount);
        await account.save({ session });

        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount: 'MINT',
            toAccount: accountNumber,
            amount,
            status: 'SUCCESS',
            type: 'DEPOSIT',
            description: description || 'Deposit',
            refNo: 'DEP' + Math.floor(Math.random() * 1000000),
            runningBalance: account.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Deposit successful", newBalance: account.balances.INR });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 7. Withdraw Money (For Invest feature)
app.post('/api/withdraw', async (req, res) => {
    const { accountNumber, amount, description } = req.body;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        if (amount <= 0) throw new Error("Invalid amount");

        const account = await Account.findOne({ accountNumber }).session(session);
        if (!account) throw new Error("Account not found");
        if (account.balances.INR < amount) throw new Error("Insufficient funds (INR)");

        account.balances.INR -= Number(amount);
        await account.save({ session });

        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount: accountNumber,
            toAccount: 'MINT',
            amount,
            status: 'SUCCESS',
            type: 'WITHDRAWAL',
            description: description || 'Withdrawal',
            refNo: 'WID' + Math.floor(Math.random() * 1000000),
            runningBalance: account.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Investment Created Successfully", newBalance: account.balances.INR });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 10. Investment Routes (FD/RD)
app.post('/api/investments', async (req, res) => {
    const { accountNumber, type, amount, tenureMonths } = req.body;

    try {
        const account = await Account.findOne({ accountNumber });
        if (!account) throw new Error("Account not found");
        if (account.kycStatus !== 'VERIFIED') throw new Error("KYC Pending: Investment creation blocked.");
        if (account.balances.INR < amount) throw new Error("Insufficient funds for Investment");

        // Deduct Principal
        account.balances.INR -= Number(amount);
        await account.save();

        // Create Investment
        const interestRate = type === 'FD' ? 6.5 : 5.5;
        const maturityAmount = Number(amount) + (Number(amount) * (interestRate / 100) * (tenureMonths / 12));
        const txnId = 'INV' + Math.floor(10000000 + Math.random() * 90000000); // Unique for Investment

        const newInv = await Investment.create({
            accountNumber,
            type,
            principalAmount: amount,
            interestRate,
            maturityDate: new Date(new Date().setMonth(new Date().getMonth() + tenureMonths)),
            maturityAmount,
            status: 'Active',
            transactionId: txnId,
            issueDate: new Date()
        });

        // Transaction Record
        await Transaction.create({
            transactionId: uuidv4(),
            fromAccount: accountNumber,
            toAccount: 'BANK_RESERVE',
            amount,
            type: 'INVESTMENT_DEBIT',
            status: 'SUCCESS',
            description: `Created ${type} #${newInv._id}`,
            runningBalance: account.balances.INR,
            refNo: txnId
        });

        res.json(newInv);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/accounts/:accountNumber/investments', async (req, res) => {
    const investments = await Investment.find({ accountNumber: req.params.accountNumber });
    res.json(investments);
});

// 10.1 Delete Investment (Premature Withdrawal)
app.delete('/api/investments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const investment = await Investment.findById(id);
        if (!investment) throw new Error("Investment not found");

        const account = await Account.findOne({ accountNumber: investment.accountNumber });

        // Calculate Refund with Penalty (e.g. 2% of Principal)
        const penaltyRate = 0.02;
        const penalty = Math.round(investment.principalAmount * penaltyRate);
        const refundAmount = investment.principalAmount - penalty;

        // Refund
        account.balances.INR += refundAmount;
        await account.save();

        // Remove Investment Record
        await Investment.findByIdAndDelete(id);

        // Transaction Record
        await Transaction.create({
            transactionId: uuidv4(),
            fromAccount: 'BANK_RESERVE',
            toAccount: account.accountNumber,
            amount: refundAmount,
            type: 'INVESTMENT_WITHDRAWAL',
            status: 'SUCCESS',
            description: `Premature Closure - Penalty: ₹${penalty}`,
            refNo: 'WID_INV' + Math.floor(Math.random() * 1000000),
            runningBalance: account.balances.INR
        });

        res.json({ message: "Investment Broken Successfully", refundAmount });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 11. Loan Routes
app.post('/api/loans/apply', async (req, res) => {
    const { accountNumber, amount, tenureMonths, documents, loanType } = req.body;

    const account = await Account.findOne({ accountNumber });
    if (!account) return res.status(404).json({ error: "Account not found" });

    // Advanced Approval Logic
    // 1. Balance Check (> 5% of Loan Amount for 'Secured' loans like Home/Car, > 10% for others)
    const requiredBalanceRatio = (loanType === 'Home' || loanType === 'Car') ? 0.05 : 0.10;
    const isApproved = account.balances.INR > (amount * requiredBalanceRatio);

    if (!isApproved) {
        return res.json({ status: 'Rejected', message: `Insufficient collateral balance. Maintain at least ${(requiredBalanceRatio * 100)}% of loan amount.` });
    }

    // Dynamic Interest Rates
    const rates = { 'Personal': 12, 'Home': 8.5, 'Car': 9.0, 'Education': 10.0 };
    const interestRate = rates[loanType] || 12;

    const r = interestRate / 12 / 100;
    const emi = (amount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);

    // Generate Amortization Schedule
    let schedule = [];
    let balance = amount;
    for (let i = 1; i <= tenureMonths; i++) {
        let interest = balance * r;
        let principal = emi - interest;
        balance -= principal;
        schedule.push({
            installmentNo: i,
            dueDate: new Date(new Date().setMonth(new Date().getMonth() + i)),
            emi: Math.round(emi),
            interest: Math.round(interest),
            principal: Math.round(principal),
            balance: Math.max(0, Math.round(balance)),
            status: 'Pending'
        });
    }

    const loan = await Loan.create({
        accountNumber,
        loanId: 'LN' + Math.floor(Math.random() * 1000000),
        loanType: loanType || 'Personal',
        amount,
        tenureMonths,
        interestRate,
        emiAmount: Math.round(emi),
        status: 'Active',
        documents,
        amortizationSchedule: schedule
    });

    // Disburse Funds
    account.balances.INR += Number(amount);
    await account.save();
    await Transaction.create({
        transactionId: uuidv4(),
        fromAccount: 'BANK_LOAN',
        toAccount: accountNumber,
        amount,
        type: 'LOAN_DISBURSAL',
        status: 'SUCCESS',
        description: `${loanType} Loan Disbursal ${loan.loanId}`,
        runningBalance: account.balances.INR
    });

    res.json({ loan, message: "Loan Approved & Disbursed!" });
});

app.post('/api/loans/repay', async (req, res) => {
    const { accountNumber, loanId, installmentNo } = req.body;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const account = await Account.findOne({ accountNumber }).session(session);
        const loan = await Loan.findOne({ loanId }).session(session);

        if (!account || !loan) throw new Error("Invalid Account or Loan ID");

        const installment = loan.amortizationSchedule.find(i => i.installmentNo === installmentNo);
        if (!installment) throw new Error("Invalid Installment");
        if (installment.status === 'Paid') throw new Error("Installment already paid");

        if (account.balances.INR < installment.emi) throw new Error("Insufficient Funds");

        // Deduct from Account
        account.balances.INR -= installment.emi;
        await account.save({ session });

        // Update Loan
        installment.status = 'Paid';
        loan.paidAmount = (loan.paidAmount || 0) + installment.emi; // Initialize paidAmount if not exists
        if (loan.paidAmount >= (loan.emiAmount * loan.tenureMonths * 0.99)) { // Close enough margin
            loan.status = 'Closed';
        }
        await loan.save({ session });

        // Record Transaction
        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount: accountNumber,
            toAccount: 'BANK_LOAN_REPAYMENT',
            amount: installment.emi,
            type: 'LOAN_REPAYMENT',
            status: 'SUCCESS',
            description: `EMI Payment ${loan.loanId} #${installmentNo}`,
            runningBalance: account.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "EMI Paid Successfully", loanStatus: loan.status });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// ==========================
// 💱 FOREX ROUTES (Module 5)
// ==========================

app.post('/api/forex/convert', verifyToken, async (req, res) => {
    const { from, to, amount } = req.body; // e.g., from: 'INR', to: 'USD'
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        if (amount <= 0) throw new Error("Invalid amount");
        if (!['INR', 'USD', 'EUR'].includes(from) || !['INR', 'USD', 'EUR'].includes(to)) {
            throw new Error("Invalid currency");
        }
        if (from === to) throw new Error("Currencies must be different");

        const account = await Account.findOne({ accountNumber: req.user.id }).session(session);
        if (!account) throw new Error("Account not found");

        // 1. Check Balance
        if (account.balances[from] < amount) {
            throw new Error(`Insufficient ${from} balance`);
        }

        // 2. Define Rates (Simulated)
        const RATES = {
            'INR': 1,
            'USD': 83.50,
            'EUR': 90.00
        };

        // 3. Calculate Exchange
        // Convert 'from' to INR base, then to 'to'
        const baseAmountInINR = amount * RATES[from]; // e.g. 100 USD * 83.5 = 8350 INR
        const targetAmount = baseAmountInINR / RATES[to]; // e.g. 8350 INR / 1 = 8350 INR

        // 4. Apply Fee (2% Markup/Fee)
        // If Buying Foreign Currency (INR -> USD), you get LESS USD.
        // If Selling Foreign Currency (USD -> INR), you get LESS INR.
        const FEE_PERCENT = 0.02;
        const feeAmount = targetAmount * FEE_PERCENT;
        const finalAmount = targetAmount - feeAmount;

        // 5. Update Balances
        account.balances[from] -= Number(amount);
        account.balances[to] += Number(finalAmount);

        await account.save({ session });

        // 6. Record Transaction
        await Transaction.create([{
            transactionId: uuidv4(),
            fromAccount: account.accountNumber,
            toAccount: 'FOREX_DESK',
            amount: amount,
            type: 'FOREX',
            status: 'SUCCESS',
            description: `Converted ${amount} ${from} to ${finalAmount.toFixed(2)} ${to}`,
            refNo: 'FX' + Math.floor(Math.random() * 1000000),
            runningBalance: account.balances[from] // Show running balance of source currency
        }], { session });

        await session.commitTransaction();

        res.json({
            message: "Conversion Successful",
            from,
            to,
            debited: amount,
            credited: Number(finalAmount.toFixed(2)),
            fee: Number(feeAmount.toFixed(2)),
            balances: account.balances
        });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

app.get('/api/accounts/:accountNumber/loans', async (req, res) => {
    const loans = await Loan.find({ accountNumber: req.params.accountNumber });
    res.json(loans);
});

// ==========================
// 🛡️ BENEFICIARY ROUTES (Module 2)
// ==========================

// Add Beneficiary
app.post('/api/beneficiaries/add', verifyToken, async (req, res) => {
    try {
        const { payeeName, payeeAccountNum, ifsc } = req.body;
        const ownerId = req.user.id;

        if (payeeAccountNum === ownerId) return res.status(400).json({ error: "Cannot add yourself as beneficiary" });

        const existing = await Beneficiary.findOne({ ownerId, payeeAccountNum });
        if (existing) return res.status(400).json({ error: "Beneficiary already exists" });

        // Cooling Period: 30 Minutes
        const activationTime = new Date(Date.now() + 30 * 60 * 1000);

        const newBen = await Beneficiary.create({
            ownerId, payeeName, payeeAccountNum, ifsc,
            status: 'PENDING',
            activationTime
        });

        res.json({ message: "Beneficiary Added. Returns in 30 mins cooling period.", beneficiary: newBen });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Beneficiaries
app.get('/api/beneficiaries', verifyToken, async (req, res) => {
    try {
        const list = await Beneficiary.find({ ownerId: req.user.id }).sort({ addedAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Beneficiary
app.delete('/api/beneficiaries/:id', verifyToken, async (req, res) => {
    try {
        await Beneficiary.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
        res.json({ message: "Beneficiary Removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 🤖 AUTO-PAY ROUTES (Module 3)
// ==========================

app.post('/api/autopay/create', verifyToken, async (req, res) => {
    try {
        const { payeeAccount, payeeName, amount, dayOfMonth } = req.body;

        // Calculate First Execution Date
        const now = new Date();
        let nextDate = new Date();
        nextDate.setDate(dayOfMonth);

        // If dayOfMonth is passed for this month, move to next
        if (now.getDate() >= dayOfMonth) {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }

        const newInstr = await StandingInstruction.create({
            userId: req.user.id,
            payeeAccount, payeeName, amount, dayOfMonth,
            nextExecutionDate: nextDate
        });

        res.json({ message: "Auto-Pay Set Successfully", instruction: newInstr });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/autopay/list', verifyToken, async (req, res) => {
    try {
        const list = await StandingInstruction.find({ userId: req.user.id });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/autopay/:id', verifyToken, async (req, res) => {
    try {
        await StandingInstruction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        res.json({ message: "Auto-Pay Cancelled" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 💳 VIRTUAL CARD ROUTES (Module 4)
// ==========================

// Get Card Details
app.get('/api/cards/my-card', verifyToken, async (req, res) => {
    try {
        let card = await Card.findOne({ accountNumber: req.user.id });
        if (!card) {
            return res.status(404).json({ message: "No card found" });
        }
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Request/Create New Card
app.post('/api/cards/request', verifyToken, async (req, res) => {
    try {
        const existingCard = await Card.findOne({ accountNumber: req.user.id });
        if (existingCard) return res.status(400).json({ error: "Card already exists" });

        const newCard = await Card.create({
            accountNumber: req.user.id,
            cardNumber: '4' + Math.floor(Math.random() * 1000000000000000), // Random Visa
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            expiryDate: '12/30',
            cardType: 'DEBIT',
            ownerName: 'VALUED CUSTOMER' // In a real app, fetch name from User model
        });
        res.json(newCard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle Freeze
app.post('/api/cards/toggle-freeze', verifyToken, async (req, res) => {
    try {
        const card = await Card.findOne({ accountNumber: req.user.id });
        if (!card) return res.status(404).json({ error: "Card not found" });

        card.isFrozen = !card.isFrozen;
        await card.save();
        res.json({ message: card.isFrozen ? "Card Frozen" : "Card Unfrozen", isFrozen: card.isFrozen });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Regenerate CVV
app.post('/api/cards/regenerate-cvv', verifyToken, async (req, res) => {
    try {
        const card = await Card.findOne({ accountNumber: req.user.id });
        if (!card) return res.status(404).json({ error: "Card not found" });

        if (card.isFrozen) return res.status(400).json({ error: "Cannot regenerate CVV while card is frozen" });

        card.cvv = Math.floor(100 + Math.random() * 900).toString();
        await card.save();
        res.json({ message: "New CVV Generated", cvv: card.cvv });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 📱 UPI ROUTES
// ==========================

// 1. Get UPI Profile
app.get('/api/upi/profile/:accountNumber', verifyToken, async (req, res) => {
    try {
        const account = await Account.findOne({ accountNumber: req.params.accountNumber });
        if (!account) return res.status(404).json({ error: "Account not found" });

        res.json({
            upiIds: account.upiIds,
            primaryVpa: account.upiIds?.[0] || account.upiId,
            hasPin: !!account.upiPin
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Verify VPA
app.post('/api/upi/verify', async (req, res) => {
    try {
        let { vpa } = req.body;
        // Search in upiIds array
        let account = await Account.findOne({ upiIds: vpa });

        // If not found by VPA, try by Mobile Number
        if (!account) {
            account = await Account.findOne({ mobile: vpa });
            if (account) {
                // If found by mobile, resolve to their primary VPA
                vpa = account.upiIds?.[0] || account.upiId || `${account.mobile}@openbank`;
            }
        }

        if (!account) return res.status(404).json({ error: "VPA or Mobile Number not found" });

        res.json({
            name: account.ownerName,
            vpa: vpa,
            message: "Verified"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Set PIN
app.post('/api/upi/set-pin', verifyToken, async (req, res) => {
    try {
        const { accountNumber, pin } = req.body;
        if (!/^\d{6}$/.test(pin)) return res.status(400).json({ error: "PIN must be 6 digits" });

        const hashedPin = await bcrypt.hash(pin, 10);
        await Account.findOneAndUpdate({ accountNumber }, { upiPin: hashedPin });

        res.json({ message: "UPI PIN Set Successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Pay via UPI
app.post('/api/upi/pay', verifyToken, async (req, res) => {
    const { fromAccount, toVpa, amount, pin } = req.body;
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // Sender
        const sender = await Account.findOne({ accountNumber: fromAccount }).session(session);
        if (!sender) throw new Error("Sender not found");

        // Validate PIN
        if (!sender.upiPin) throw new Error("UPI PIN not set");
        const isPinValid = await bcrypt.compare(pin, sender.upiPin);
        if (!isPinValid) throw new Error("Invalid UPI PIN");

        // Validate Balance (Updated to use balances.INR)
        if (sender.balances.INR < amount) throw new Error("Insufficient Funds");

        // Receiver
        const receiver = await Account.findOne({ upiIds: toVpa }).session(session);
        if (!receiver) throw new Error("Invalid VPA / Receiver not found");

        if (sender.accountNumber === receiver.accountNumber) throw new Error("Cannot pay to self");

        // Execute Transfer
        sender.balances.INR -= Number(amount);
        receiver.balances.INR += Number(amount);

        await sender.save({ session });
        await receiver.save({ session });

        // Record Transaction
        const txnId = uuidv4();
        await Transaction.create([{
            transactionId: txnId,
            fromAccount: sender.accountNumber,
            toAccount: receiver.accountNumber, // Storing Account Num, not VPA, for consistency
            amount: Number(amount),
            type: 'UPI',
            status: 'SUCCESS',
            description: `UPI to ${receiver.ownerName} (${toVpa})`,
            refNo: 'UPI' + Math.floor(Date.now() / 1000),
            runningBalance: sender.balances.INR
        }], { session });

        await session.commitTransaction();
        res.json({ message: "Payment Successful", transactionId: txnId });

    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

// 5. Manage VPAs
app.post('/api/upi/manage/add', verifyToken, async (req, res) => {
    try {
        const { accountNumber, newVpa } = req.body;

        // Check availability
        const exists = await Account.findOne({ upiIds: newVpa });
        if (exists) return res.status(400).json({ error: "VPA already taken" });

        await Account.findOneAndUpdate(
            { accountNumber },
            { $push: { upiIds: newVpa } }
        );
        res.json({ message: "VPA Added" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/upi/manage/delete', verifyToken, async (req, res) => {
    try {
        const { accountNumber, vpaToDelete } = req.body;

        const account = await Account.findOne({ accountNumber });
        if (account.upiIds.length <= 1) return res.status(400).json({ error: "Cannot delete primary VPA" });

        await Account.findOneAndUpdate(
            { accountNumber },
            { $pull: { upiIds: vpaToDelete } }
        );
        res.json({ message: "VPA Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================
// 🎫 TICKET & DISPUTE ROUTES (Module 5)
// ==========================

// ==========================
// 🎫 TICKET & DISPUTE ROUTES (Module 5)
// ==========================

// 1. Raise Ticket (Customer)
app.post('/api/tickets/raise', verifyToken, async (req, res) => {
    try {
        const { transactionId, issueType, description } = req.body;

        // Check Duplicate
        if (transactionId) {
            const existing = await Ticket.findOne({ userId: req.user.id, transactionId });
            if (existing) return res.status(400).json({ error: "Ticket already raised for this transaction" });
        }

        const newTicket = await Ticket.create({
            userId: req.user.id,
            transactionId,
            issueType,
            description
        });

        res.json({ message: "Ticket Raised Successfully", ticket: newTicket });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. List Tickets (Customer Own)
app.get('/api/tickets/list', verifyToken, async (req, res) => {
    try {
        const list = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. List All Tickets (Admin)
app.get('/api/admin/tickets', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const tickets = await Ticket.find({}).sort({ createdAt: -1 });

        // Enrich with Customer Name (Optional but good for Admin)
        const enrichedTickets = await Promise.all(tickets.map(async (ticket) => {
            const user = await Account.findOne({ accountNumber: ticket.userId }).select('ownerName');
            return {
                ...ticket.toObject(),
                ownerName: user ? user.ownerName : 'Unknown Customer'
            };
        }));

        res.json(enrichedTickets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Resolve Ticket (Admin)
app.post('/api/tickets/resolve/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { response, status } = req.body; // status: 'RESOLVED' | 'REJECTED'
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const ticket = await Ticket.findById(req.params.id).session(session);
        if (!ticket) throw new Error("Ticket not found");
        if (ticket.status !== 'OPEN') throw new Error("Ticket is already closed");

        // Save Admin Response
        ticket.adminResponse = response || "Ticket Resolved.";
        ticket.status = status || 'RESOLVED';
        ticket.resolvedAt = new Date();
        await ticket.save({ session });

        // Notify Customer
        await Notification.create([{
            recipientAccount: ticket.userId,
            title: `Ticket Update: ${ticket.issueType}`,
            message: `Your ticket has been ${ticket.status.toLowerCase()}. Response: ${ticket.adminResponse}`,
            type: ticket.status === 'RESOLVED' ? 'SUCCESS' : 'WARNING',
            sender: 'Admin'
        }], { session });

        // Send Email (Fire-and-Forget)
        const user = await Account.findOne({ accountNumber: ticket.userId }).session(session);
        if (user) {
            sendTicketResolvedEmail(user, ticket).catch(err => console.error("Ticket Email Failed:", err.message));
        }

        await session.commitTransaction();
        res.json({ message: "Ticket Updated", ticket });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ error: error.message });
    } finally {
        session.endSession();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));