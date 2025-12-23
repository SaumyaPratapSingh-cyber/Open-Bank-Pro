const mongoose = require('mongoose');
const Card = require('./models/Card');
require('dotenv').config();

const clearCards = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        await Card.deleteMany({});
        console.log("All cards deleted successfully.");

        process.exit(0);
    } catch (error) {
        console.error("Error deleting cards:", error);
        process.exit(1);
    }
};

clearCards();
