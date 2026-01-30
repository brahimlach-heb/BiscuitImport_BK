const fs = require('fs');
const path = require('path');
const flavorService = require('../services/flavor.service');
const logger = require('../config/logger');
const { BASE_URL } = require('../config/env');

const flavorUploadDir = path.join(process.cwd(), 'uploads', 'flavors');

const ensureFlavorUploadDir = () => {
  fs.mkdirSync(flavorUploadDir, { recursive: true });
  return flavorUploadDir;
};

const saveImageAndReturnUrl = (imageInput, flavorName) => {
  if (!imageInput) return null;
  const dataUriMatch = /^data:(image\/[-+\.\w]+);base64,(.+)$/i.exec(imageInput);
  if (!dataUriMatch) {
    // Assume caller provided an existing URL/path; keep as-is.
    return imageInput;
  }

  const mimeType = dataUriMatch[1];
  const ext = (mimeType.split('/')?.[1] || 'png').split('+')[0];
  const safeName = (flavorName || 'flavor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'flavor';
  const fileName = `${Date.now()}-${safeName}.${ext}`;
  const buffer = Buffer.from(dataUriMatch[2], 'base64');
  const dir = ensureFlavorUploadDir();
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return `http://72.62.237.60:3000/uploads/flavors/${fileName}`;
};

const getAll = async (req, res, next) => {
  try {
    const rows = await flavorService.getAllFlavors();
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
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
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
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
    const payload = { ...req.body };
    const fileUrl = req.file ? `/uploads/flavors/${req.file.filename}` : null;
    const imageUrl = fileUrl || saveImageAndReturnUrl(req.body.image, req.body.name);
    if (imageUrl) payload.image = imageUrl;

    const fl = await flavorService.createFlavor(payload, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.info(`ACTION createFlavor id=${fl.id} name=${fl.name} by=${userInfo}`);
    res.status(201).json(fl);
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR createFlavor: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const payload = { ...req.body };
    const fileUrl = req.file ? `/uploads/flavors/${req.file.filename}` : null;
    const imageUrl = fileUrl || saveImageAndReturnUrl(req.body.image, req.body.name);
    if (imageUrl) payload.image = imageUrl;

    const updated = await flavorService.updateFlavor(id, payload, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!updated) {
      logger.info(`ACTION updateFlavor_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Flavor not found' });
    }
    logger.info(`ACTION updateFlavor id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR updateFlavor id=${req.params.id}: ${err.message}`, { body: req.body, user: userInfo });
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actor = req.user ? req.user.id : null;
    const deleted = await flavorService.deleteFlavor(id, actor);
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    if (!deleted) {
      logger.info(`ACTION deleteFlavor_not_found id=${id} by=${userInfo}`);
      return res.status(404).json({ error: 'Flavor not found' });
    }
    logger.info(`ACTION deleteFlavor id=${id} by=${userInfo}`);
    res.status(200).json({ success: true });
  } catch (err) {
    const userInfo = req.user ? `user_id=${req.user.id}` : 'anonymous';
    logger.error(`ERROR deleteFlavor id=${req.params.id}: ${err.message}`, { user: userInfo });
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };