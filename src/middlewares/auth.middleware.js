const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');

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
    
    // Récupérer le rôle de l'utilisateur
    const role = await roleModel.getRoleById(user.role_id);
    
    // Bloquer les utilisateurs anonymous
    if (role && role.code === 'anonymous') {
      return res.status(403).json({ success: false, message: 'Anonymous users cannot access this resource' });
    }
    
    // Vérifier si la date de désactivation est dans le passé
    if (user.deactivated_at && new Date(user.deactivated_at) < new Date()) {
      return res.status(403).json({ success: false, message: 'Account deactivated' });
    }
    
    req.user = { id: user.id, role_id: user.role_id, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};