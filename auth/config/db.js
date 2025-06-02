const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Winston logger

const connectDB = async () => {
  try {
    console.log("---------------------DB Connection started------------------")
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info('✅ MongoDB connected successfully.');
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
