const flavorModel = require('../models/flavor.model');
const historyModel = require('../models/history.model');
const logger = require('../config/logger');

const createFlavor = async (data, actorUserId) => {
  if (!data || !data.name) {
    const err = new Error('Name is required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createFlavor: name=${data.name} actor=${actorUserId || 'system'}`);
  const fl = await flavorModel.createFlavor(data);
  if (actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'ADD_FLAVOR', entity_id: fl.id, entity_type: 'FLAVOR', description: JSON.stringify(fl) });
    logger.info(`AUDIT ADD_FLAVOR: id=${fl.id} user=${actorUserId}`);
  }
  return fl;
};

const getAllFlavors = async () => {
  logger.debug('DB getAllFlavors');
  return await flavorModel.getAllFlavors();
};

const getFlavorById = async (id) => {
  logger.debug(`DB getFlavorById: id=${id}`);
  return await flavorModel.getFlavorById(id);
};

const updateFlavor = async (id, data, actorUserId) => {
  logger.info(`DB updateFlavor: id=${id} actor=${actorUserId || 'system'}`);
  const updated = await flavorModel.updateFlavor(id, data);
  if (updated && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'UPDATE_FLAVOR', entity_id: id, entity_type: 'FLAVOR', description: JSON.stringify(data) });
    logger.info(`AUDIT UPDATE_FLAVOR: id=${id} user=${actorUserId}`);
  }
  return updated;
};

const deleteFlavor = async (id, actorUserId) => {
  logger.info(`DB deleteFlavor: id=${id} actor=${actorUserId || 'system'}`);
  const deleted = await flavorModel.deleteFlavor(id);
  if (deleted && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'DELETE_FLAVOR', entity_id: id, entity_type: 'FLAVOR' });
    logger.info(`AUDIT DELETE_FLAVOR: id=${id} user=${actorUserId}`);
  }
  return deleted;
};

module.exports = {
  createFlavor,
  getAllFlavors,
  getFlavorById,
  updateFlavor,
  deleteFlavor
};