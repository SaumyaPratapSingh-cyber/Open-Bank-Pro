const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    pool: true, // Use pooled connections
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Limit messages per connection
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true,
    logger: true
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"OpenBank Pro Security" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        const logMsg = `[SUCCESS] ${new Date().toISOString()} - Email sent to ${to}\n`;
        console.log(logMsg);
        fs.appendFileSync(path.join(__dirname, '../email_debug.log'), logMsg);
    } catch (error) {
        const errorMsg = `[ERROR] ${new Date().toISOString()} - Failed to send to ${to}: ${error.message}\nStack: ${error.stack}\n`;
        console.error(errorMsg);
        fs.appendFileSync(path.join(__dirname, '../email_debug.log'), errorMsg);
        throw error; // Re-throw to handle in caller if needed
    }
};

const sendWelcomeEmail = async (user) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
        <div style="background-color: #0f172a; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #22d3ee; margin: 0;">OpenBank <span style="color: #fff; font-weight: lighter;">Pro</span></h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b;">Welcome, ${user.ownerName}!</h2>
            <p style="color: #475569; line-height: 1.6;">
                Thank you for choosing OpenBank Pro. Your account has been successfully created.
            </p>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0; font-size: 14px; color: #64748b;">YOUR ACCOUNT NUMBER</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #0f172a; font-family: monospace;">${user.accountNumber}</p>
                
                <div style="margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 15px;">
                    <p style="margin: 5px 0; font-size: 14px; color: #64748b;">CIF NUMBER</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #334155; font-family: monospace;">${user.cifNumber}</p>
                </div>
            </div>

            <p style="color: #475569;">You can now log in to the dashboard to request your Debit Card and start transacting.</p>
            
            <a href="https://open-bank-pro.vercel.app/login" style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: bold; margin-top: 10px;">Login to Dashboard</a>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
            &copy; ${new Date().getFullYear()} OpenBank Pro. Secure Banking.
        </p>
    </div>
    `;
    await sendEmail(user.email, "Welcome to OpenBank Pro - Account Details", html);
};

const sendLoginAlert = async (user) => {
    const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0; color: #0f172a;">New Login Detected</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569;">Hello <strong>${user.ownerName}</strong>,</p>
            <p style="color: #475569;">We detected a new login to your OpenBank Pro account.</p>
            
            <div style="background-color: #fff1f2; border-left: 4px solid #f43f5e; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0; font-size: 13px; color: #be123c;">TIME</p>
                <p style="margin: 0; font-weight: bold; color: #881337;">${time}</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">If this was you, you can ignore this email. If not, please contact support immediately.</p>
        </div>
    </div>
    `;
    await sendEmail(user.email, "Security Alert: New Login", html);
};

const sendOTP = async (email, otp) => {
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0; color: #0f172a;">Password Reset</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569;">You requested a password reset for your OpenBank Pro account.</p>
            <p style="color: #475569;">Your OTP is:</p>
            
            <div style="background-color: #f1f5f9; padding: 15px; margin: 20px 0; text-align: center;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${otp}</span>
            </div>

            <p style="color: #64748b; font-size: 14px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        </div>
    </div>
    `;
    await sendEmail(email, "Password Reset OTP", html);
};

const sendTicketResolvedEmail = async (user, ticket) => {
    const statusColor = ticket.status === 'RESOLVED' ? '#10b981' : '#f43f5e';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="padding: 20px; text-align: center; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
            <h2 style="margin: 0; color: #0f172a;">Support Ticket Update</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569;">Hello <strong>${user.ownerName}</strong>,</p>
            <p style="color: #475569;">Your support ticket <strong style="font-family: monospace;">#${ticket._id}</strong> has been updated.</p>
            
            <div style="background-color: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
                <p style="margin: 5px 0; font-size: 13px; color: #64748b; font-weight: bold; uppercase;">STATUS</p>
                <p style="margin: 0; font-weight: bold; color: ${statusColor}; font-size: 18px;">${ticket.status}</p>
                
                <p style="margin: 15px 0 5px 0; font-size: 13px; color: #64748b; font-weight: bold; uppercase;">ADMIN RESPONSE</p>
                <p style="margin: 0; color: #334155; line-height: 1.5;">${ticket.adminResponse}</p>
            </div>

            <p style="color: #64748b; font-size: 14px;">You can view the full details in the Support section of your dashboard.</p>
        </div>
    </div>
    `;
    await sendEmail(user.email, `Ticket Updated: ${ticket.issueType}`, html);
};

const sendAdminMessageEmail = async (user, title, message, type) => {
    const colorMap = {
        'INFO': '#0ea5e9', // Blue
        'SUCCESS': '#10b981', // Green
        'WARNING': '#f59e0b', // Amber
        'ALERT': '#f43f5e' // Red
    };
    const color = colorMap[type] || colorMap['INFO'];

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="padding: 20px; border-bottom: 4px solid ${color}; background-color: #ffffff;">
            <h2 style="margin: 0; color: #0f172a;">${title}</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="color: #475569;">Hello <strong>${user.ownerName}</strong>,</p>
            
            <div style="font-size: 16px; color: #334155; line-height: 1.6; whitespace-pre-line;">
                ${message.replace(/\n/g, '<br>')}
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an important notification from OpenBank Pro.</p>
        </div>
    </div>
    `;
    await sendEmail(user.email, title, html);
};

module.exports = { sendWelcomeEmail, sendLoginAlert, sendOTP, sendTicketResolvedEmail, sendAdminMessageEmail };
