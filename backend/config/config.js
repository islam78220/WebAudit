require('dotenv').config();

module.exports = {
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/web-audit',
  JWT_SECRET: process.env.JWT_SECRET || '3f923a8b214e0b0f7115f1cf9db13e5d3f75d52878a9b0b32f5ad302d04b2b89d99bba6b013b9f1e0b33fd93f6a15c7e1d4e02c83a8d8c6f473c6d46ad1ad41e',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
  GTMETRIX_API_KEY: process.env.GTMETRIX_API_KEY,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
};

