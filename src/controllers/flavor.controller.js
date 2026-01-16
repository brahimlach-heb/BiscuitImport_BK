const flavorService = require('../services/flavor.service');

const getAll = async (req, res, next) => {
  try {
    const rows = await flavorService.getAllFlavors();
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.info(`ACTION getAllFlavors count=${Array.isArray(rows) ? rows.length : 0} by=${userInfo}`);
    res.status(200).json(rows);
  } catch (err) {
    logger.error(`ERROR getAllFlavors: ${err.message}`);
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const row = await flavorService.getFlavorById(id);
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    if (!row) {
      logger.info(`ACTION getFlavorById_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Flavor not found' });
    }
    logger.info(`ACTION getFlavorById id=${id} name=${row.name} by=${userInfo}`);
    res.status(200).json(row);
  } catch (err) {
    logger.error(`ERROR getFlavorById id=${req.params.id}: ${err.message}`);
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const actor = req.user ? req.user.id : null;
    const fl = await flavorService.createFlavor(req.body, actor);
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.info(`ACTION createFlavor id=${fl.id} name=${fl.name} by=${userInfo}`);
    res.status(201).json(fl);
  } catch (err) {
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.error(`ERROR createFlavor: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const updated = await flavorService.updateFlavor(id, req.body, actor);
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    if (!updated) {
      logger.info(`ACTION updateFlavor_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Flavor not found' });
    }
    logger.info(`ACTION updateFlavor id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.error(`ERROR updateFlavor id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const deleted = await flavorService.deleteFlavor(id, actor);
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    if (!deleted) {
      logger.info(`ACTION deleteFlavor_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Flavor not found' });
    }
    logger.info(`ACTION deleteFlavor id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `${req.user.first_name} ${req.user.last_name} (${req.user.id})` : 'anonymous';
    logger.error(`ERROR deleteFlavor id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };