const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');
const logger = require('../config/logger');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    logger.info(`ACTION registerUser email=${user.email} id=${user.id}`);
    return success(res, { user }, 'User registered', 201);
  } catch (err) {
    logger.error(err);
    return error(res, err.message || 'Registration failed', err.status || 500);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    logger.info(`ACTION login email=${email} userId=${data && data.user ? data.user.id : 'unknown'}`);
    return success(res, data, 'Authenticated', 200);
  } catch (err) {
    logger.error(err);
    return error(res, err.message || 'Authentication failed', err.status || 500);
  }
};

const profile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    logger.info(`ACTION getProfile userId=${user ? user.id : (req.user ? req.user.id : 'unknown')}`);
    return success(res, { user }, 'Profile retrieved');
  } catch (err) {
    logger.error(err);
    return error(res, err.message || 'Failed to get profile', err.status || 500);
  }
};

const update = async (req, res, next) => {
  try {
    const modified_by = req.user ? req.user.id : null;
    const updated = await authService.updateProfile(req.user.id, req.body, modified_by);
    logger.info(`ACTION updateProfile userId=${req.user.id}`);
    return success(res, { user: updated }, 'Profile updated');
  } catch (err) {
    logger.error(err);
    return error(res, err.message || 'Update failed', err.status || 500);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const modified_by = req.user ? req.user.id : null;
    await authService.deactivate(req.user.id, modified_by);
    logger.info(`ACTION deactivateAccount userId=${req.user.id}`);
    return success(res, {}, 'Account deactivated');
  } catch (err) {
    logger.error(err);
    return error(res, err.message || 'Deactivation failed', err.status || 500);
  }
};

module.exports = {
  register,
  login,
  profile,
  update,
  deactivate
};