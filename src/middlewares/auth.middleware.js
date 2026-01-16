const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');

module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await userModel.getUserById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (user.deactivated_at) return res.status(403).json({ success: false, message: 'Account deactivated' });
    req.user = { id: user.id, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};