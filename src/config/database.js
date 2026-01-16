const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const logger = require("./logger");

const dbPath = path.join(__dirname, "..", "database", "database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error("Erreur SQLite : " + err.message);
  } else {
    logger.info("Base SQLite connectée avec succès");
  }
});

module.exports = db;
