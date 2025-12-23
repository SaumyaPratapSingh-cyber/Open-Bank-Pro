const twilio = require('twilio');

const sendSMS = async (mobile, message) => {
    try {
        if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
            console.log("Attempting to send SMS via Twilio...");
            const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: mobile.startsWith('+') ? mobile : `+91${mobile}` // Default to India (+91) if not specified, adjust as needed or assume user provides full number. 
                // Given the context is an Indian bank sandbox, prepending +91 if missing is a reasonable default for testing.
                // However, user input usually just has the number.
            });
            console.log(`✅ SMS Sent to ${mobile} via Twilio`);
        } else {
            // Fallback for Dev/Testing without Credentials
            console.log("⚠️ Twilio Credentials Missing in .env (TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)");
            console.log("========================================");
            console.log(`📩 SMS SIMULATION to ${mobile}:`);
            console.log(`📝 MESSAGE: ${message}`);
            console.log("========================================");
        }
    } catch (error) {
        console.error("❌ SMS Send Failed:", error.message);
        // Don't throw error to stop flow, just log it.
    }
};

module.exports = { sendSMS };
