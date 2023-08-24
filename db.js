const mongoose = require('mongoose');
require('dotenv').config();

monogoURI = process.env.MONGO_URI

const connectToMongo = () => {
    mongoose.connect(monogoURI)
    .then(console.log("Connected to MongoDB successfully"))
    .catch((err) => console.error("Failed to connect to database"))
}

module.exports = connectToMongo;
