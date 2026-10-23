const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    isConnected = false;
    console.warn(`[Database Warning] Could not establish initial MongoDB connection: ${err.message}`);
    console.warn(`[Database Warning] The server will continue running. Ensure MongoDB daemon (mongod) is active.`);
  }

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connection established.');
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB disconnected.');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[Database Error] ${err.message}`);
  });
}

function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isDbConnected,
};
