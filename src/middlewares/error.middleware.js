const logger = require("../config/logger");
const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  logger.error(err.stack || err);
  const status = err.status || 500;
  const message = err.status ? err.message : 'Erreur interne du serveur';
  return error(res, message, status);
};

