const userModel = require('../models/user.model');
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
  const { first_name, last_name, email, phone, password, deactivated_at } = data;
  if (!first_name || !last_name || !email || !password) {
    const err = new Error('Missing required fields');
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

  const user = await userModel.createUser({ first_name, last_name, email, phone, password, deactivated_at: deact });
  return user;
};

const login = async (email, password) => {
  console.log("login::::::::", email, password);
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
  if (user.deactivated_at) {
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
  const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role
  }};
};

const getProfile = async (id) => {
  const user = await userModel.getUserById(id);
  return user;
};

const updateProfile = async (id, data, modified_by) => {
  const { first_name, last_name, email, phone, password, role } = data;
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
  const success = await userModel.updateUser(id, { first_name, last_name, email, phone, password, modified_by, role });
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