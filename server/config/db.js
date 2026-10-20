const mongoose = require('mongoose');

const dns = require('node:dns');

// Use public DNS resolvers
dns.setServers([
  '8.8.8.8',
  '8.8.4.4'
]);
let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('ℹ️  MongoDB Notice: MONGODB_URI not set in .env. Running in hybrid local-storage mode.');
    console.log('👉 To enable MongoDB Atlas: add MONGODB_URI=your_connection_string to server/.env');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout quickly if unreachable so server doesn't hang
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
    console.log('🔄 Falling back to zero-dependency local JSON persistence engine.');
    isConnected = false;
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = {
  connectDB,
  getIsConnected
};
