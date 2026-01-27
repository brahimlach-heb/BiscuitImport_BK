const bankService = require('../services/bank.service');
const logger = require('../config/logger');

const create = async (req, res, next) => {
  try {
    const data = req.body;
    const created_by = req.user ? req.user.id : null;
    const bank = await bankService.createBank(data, created_by);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createBank id=${bank.id} code=${bank.code} by=${userInfo}`);
    res.status(201).json(bank);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createBank: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const banks = await bankService.getAllBanks();
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getAllBanks count=${banks.length} by=${userInfo}`);
    res.status(200).json(banks);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getAllBanks: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const bank = await bankService.getBankById(id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION getBankById id=${id} by=${userInfo}`);
    res.status(200).json(bank);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR getBankById id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    const modified_by = req.user ? req.user.id : null;
    const bank = await bankService.updateBank(id, data, modified_by);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION updateBank id=${id} by=${userInfo}`);
    res.status(200).json(bank);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateBank id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await bankService.deleteBank(id);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION deleteBank id=${id} by=${userInfo}`);
    res.status(200).json({ success: true, message: 'Bank deleted' });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deleteBank id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { create, getAll, getById, update, remove };
