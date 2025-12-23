require('dotenv').config();
const axios = require('axios');

const testApi = async () => {
    try {
        // 1. Login to get token
        console.log("Attempting Login...");
        const loginRes = await axios.post('http://localhost:5000/api/login', {
            accountNumber: '62273694', // Using the known admin/user account
            password: 'password123' // Assuming default password or specific one if known. 
            // Wait, I don't know the password for sure. 
            // I'll try to find a user without password first? No, login prevents that.
            // I will cheat and look at the DB script I made or just use the token if I have one... I don't.
            // Actually, for the /api/accounts/:id route, it is NOT protected by verifyToken middleware in server.js!
            // Line 231: app.get('/api/accounts/:accountNumber', async (req, res) => { ... })
            // It has NO middleware. So I can hit it directly.
        });

        // Wait, if I don't know the password I can't login. 
        // But the getAccount route is PUBLIC in the code I saw earlier (Line 231 of server.js in Step 163).
    } catch (e) {
        // console.log("Login failed (expected without password), trying direct access...");
    }

    try {
        console.log("\nTesting GET /api/accounts/62273694");
        const res = await axios.get('http://localhost:5000/api/accounts/62273694');
        console.log("✅ API Success!");
        console.log("Data:", res.data);
    } catch (error) {
        console.error("❌ API Failed:", error.response ? error.response.data : error.message);
    }
};

testApi();
