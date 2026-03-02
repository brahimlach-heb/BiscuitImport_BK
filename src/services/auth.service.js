const userModel = require('../models/user.model');
const roleModel = require('../models/role.model');
const orderModel = require('../models/order.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const env = require('../config/env');

const validatePhone = (phone) => {
  // basic validation: digits and length between 8 and 15
  if (!phone) return true;
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 15;
};

const register = async (data) => {
  const { first_name, last_name, email, phone, address, password, deactivated_at, role_id, discount_percent, is_active, user_type } = data;
  
  if (!first_name || !last_name || !email || !password || !role_id) {
    const err = new Error('Missing required fields (first_name, last_name, email, password, role_id)');
    err.status = 400;
    throw err;
  }
  if (!validator.isEmail(email)) {
    const err = new Error('Invalid email');
    err.status = 400;
    throw err;
  }
  if (!validatePhone(phone)) {
    const err = new Error('Invalid phone');
    err.status = 400;
    throw err;
  }

  // deactivated_at: optional, default to 2099-12-31
  let deact = '2099-12-31';
  if (deactivated_at) {
    // accept ISO date or YYYY-MM-DD; use validator to check
    if (!validator.isISO8601(deactivated_at)) {
      const err = new Error('Invalid deactivated_at date format (expected ISO 8601 / YYYY-MM-DD)');
      err.status = 400;
      throw err;
    }
    deact = deactivated_at.split('T')[0];
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    const err = new Error('Email already exists');
    err.status = 409;
    throw err;
  }

  const user = await userModel.createUser({ 
    first_name, 
    last_name, 
    email, 
    phone,
    address,
    password, 
    role_id,
    discount_percent,
    is_active,
    deactivated_at: deact,
    user_type
  });
  
  // Récupérer le code du rôle
  const role = await roleModel.getRoleById(user.role_id);
  
  return {
    ...user,
    role_code: role ? role.code : null
  };
};

const login = async (email, password) => {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }
  const user = await userModel.findByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  
  // Récupérer le code du rôle
  const role = await roleModel.getRoleById(user.role_id);
  
  // Bloquer les utilisateurs anonymous
  if (role && role.code === 'anonymous') {
    const err = new Error('Anonymous users cannot login');
    err.status = 403;
    throw err;
  }
  
  // Vérifier si la date de désactivation est dans le passé
  if (user.deactivated_at && new Date(user.deactivated_at) < new Date()) {
    const err = new Error('Account deactivated');
    err.status = 403;
    throw err;
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  await userModel.updateLastLogin(user.id);
  
  // Compter les commandes en attente
  const orders = await orderModel.getOrdersByUser(user.id);
  const pendingInvoices = orders.filter(o => o.status && o.status.toUpperCase() === 'PENDING').length;
  
  const token = jwt.sign({ id: user.id, role_id: user.role_id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role_id: user.role_id,
    role_code: role ? role.code : null,
    discount_percent: user.discount_percent,
    is_active: user.is_active,
    pendingInvoices: pendingInvoices
  }};
};

const getProfile = async (id) => {
  const user = await userModel.getUserById(id);
  if (!user) return null;
  const orders = await orderModel.getOrdersByUser(user.id);
  const pendingInvoices = orders.filter(o => o.status && o.status.toUpperCase() === 'PENDING').length;
  return {
    ...user,
    pendingInvoices
  };
};

const updateProfile = async (id, data, modified_by) => {
  const { first_name, last_name, email, phone, address, password, user_type } = data;
  if (email && !validator.isEmail(email)) {
    const err = new Error('Invalid email');
    err.status = 400;
    throw err;
  }
  if (phone && !validatePhone(phone)) {
    const err = new Error('Invalid phone');
    err.status = 400;
    throw err;
  }
  const success = await userModel.updateUser(id, { first_name, last_name, email, phone, address, password, modified_by, user_type });
  if (!success) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return await userModel.getUserById(id);
};

const deactivate = async (id, modified_by) => {
  const success = await userModel.deactivateUser(id, modified_by);
  if (!success) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return true;
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  deactivate
};