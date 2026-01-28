const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');

// Middleware d'authentification optionnel - n'empêche pas l'accès si pas de token
module.exports = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  // Si pas de token, continuer sans authentification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await userModel.getUserById(decoded.id);
    
    // Si l'utilisateur n'existe pas ou est désactivé, continuer sans authentification
    if (!user || (user.deactivated_at && new Date(user.deactivated_at) < new Date())) {
      req.user = null;
      return next();
    }
    
    // Récupérer le rôle de l'utilisateur
    const role = await roleModel.getRoleById(user.role_id);
    
    // Stocker les infos de l'utilisateur incluant le role_id et role_code
    req.user = { 
      id: user.id, 
      role_id: user.role_id,
      role_code: role ? role.code : null,
      email: user.email 
    };
    next();
  } catch (err) {
    // En cas d'erreur de vérification du token, continuer sans authentification
    req.user = null;
    next();
  }
};
