const mongoose = require('mongoose');
const logger = require('./logger');

module.exports = async function connectDB() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!mongoUrl) throw new Error('MONGO_URL not set');
  if (!dbName) throw new Error('DB_NAME not set');
  const uri = `${mongoUrl}/${dbName}`;
  await mongoose.connect(uri, { maxPoolSize: 20 });
  logger.info('MongoDB connected to ' + uri);
};
