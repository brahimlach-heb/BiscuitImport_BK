const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  PORT: process.env.PORT || 3000,
  BASE_URL: process.env.BASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};