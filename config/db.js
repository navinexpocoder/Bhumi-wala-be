const mongoose = require('mongoose');
const logger = require('./logger');

let retryScheduled = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-selling');
    retryScheduled = false;
    console.log('MongoDB connected successfully');
    logger.info('MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port
    });
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', {
      message: error.message,
      error: error.stack,
    });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }

    if (!retryScheduled) {
      retryScheduled = true;
      logger.warn('Retrying MongoDB connection in 5 seconds (dev mode).');
      setTimeout(() => {
        connectDB();
      }, 5000);
    }

    return null;
  }
};

module.exports = connectDB;
