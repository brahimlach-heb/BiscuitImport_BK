const userService = require('../services/user.service');
const logger = require('../config/logger');

const getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    logger.info(`ACTION getAllUsers by=${req.user ? req.user.id : 'anonymous'} count=${Array.isArray(users) ? users.length : 0}`);
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await userService.getUserById(id);
    if (!user) {
      logger.info(`ACTION getUserById_not_found id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info(`ACTION getUserById id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    logger.info(`ACTION createUser id=${user.id} email=${user.email} by=${req.user ? req.user.id : 'anonymous'}`);
    res.status(201).json(user);
  } catch (err) {
    // handle unique constraint error from sqlite
    if (err && err.message && err.message.includes('UNIQUE constraint failed')) {
      logger.info(`ACTION createUser_failed conflict email=${req.body && req.body.email ? req.body.email : 'unknown'}`);
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const updated = await userService.updateUser(id, req.body);
    if (!updated) {
      logger.info(`ACTION updateUser_not_found id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info(`ACTION updateUser id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
    res.status(200).json({ success: true });
  } catch (err) {
    if (err && err.message && err.message.includes('UNIQUE constraint failed')) {
      logger.info(`ACTION updateUser_failed conflict id=${req.params.id}`);
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const deleted = await userService.deleteUser(id);
    if (!deleted) {
      logger.info(`ACTION deleteUser_not_found id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
      return res.status(404).json({ error: 'User not found' });
    }
    logger.info(`ACTION deleteUser id=${id} by=${req.user ? req.user.id : 'anonymous'}`);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
