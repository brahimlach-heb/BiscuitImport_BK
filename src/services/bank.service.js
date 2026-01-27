const bankModel = require('../models/bank.model');
const logger = require('../config/logger');

const createBank = async (data, created_by) => {
  const { code, label } = data;
  
  if (!code || !label) {
    const err = new Error('Code and label are required');
    err.status = 400;
    throw err;
  }

  logger.info(`DB createBank: code=${code} label=${label} created_by=${created_by}`);
  const bank = await bankModel.createBank({ code, label, created_by });
  logger.info(`BANK CREATED: id=${bank.id} code=${code}`);
  return bank;
};

const getAllBanks = async () => {
  logger.debug(`DB getAllBanks`);
  return await bankModel.getAllBanks();
};

const getBankById = async (id) => {
  logger.debug(`DB getBankById: id=${id}`);
  const bank = await bankModel.getBankById(id);
  if (!bank) {
    const err = new Error('Bank not found');
    err.status = 404;
    throw err;
  }
  return bank;
};

const updateBank = async (id, data, modified_by) => {
  const { code, label } = data;
  
  if (!code || !label) {
    const err = new Error('Code and label are required');
    err.status = 400;
    throw err;
  }

  logger.info(`DB updateBank: id=${id} code=${code} label=${label} modified_by=${modified_by}`);
  const success = await bankModel.updateBank(id, { code, label, modified_by });
  
  if (!success) {
    const err = new Error('Bank not found');
    err.status = 404;
    throw err;
  }
  
  logger.info(`BANK UPDATED: id=${id}`);
  return await bankModel.getBankById(id);
};

const deleteBank = async (id) => {
  logger.info(`DB deleteBank: id=${id}`);
  const success = await bankModel.deleteBank(id);
  
  if (!success) {
    const err = new Error('Bank not found');
    err.status = 404;
    throw err;
  }
  
  logger.info(`BANK DELETED: id=${id}`);
  return true;
};

module.exports = {
  createBank,
  getAllBanks,
  getBankById,
  updateBank,
  deleteBank
};
