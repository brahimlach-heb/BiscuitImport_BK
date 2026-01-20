const db = require('../config/database');

// Create table flavor
db.run(`CREATE TABLE IF NOT EXISTS flavor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  image TEXT
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE flavor ADD COLUMN image TEXT");

const createFlavor = ({ name, description, color, image }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO flavor (name, description, color, image) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, description || null, color || null, image || null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM flavor WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getAllFlavors = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM flavor', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getFlavorById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM flavor WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateFlavor = (id, { name, description, color, image }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE flavor SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color), image = COALESCE(?, image) WHERE id = ?';
    db.run(sql, [name || null, description || null, color || null, image || null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteFlavor = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM flavor WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createFlavor,
  getAllFlavors,
  getFlavorById,
  updateFlavor,
  deleteFlavor
};