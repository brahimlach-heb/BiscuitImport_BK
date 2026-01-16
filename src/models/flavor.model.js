const db = require('../config/database');

// Create table flavor
db.run(`CREATE TABLE IF NOT EXISTS flavor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT
)`);

const createFlavor = ({ name, description, color }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO flavor (name, description, color) VALUES (?, ?, ?)';
    db.run(sql, [name, description || null, color || null], function (err) {
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

const updateFlavor = (id, { name, description, color }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE flavor SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color) WHERE id = ?';
    db.run(sql, [name || null, description || null, color || null, id], function (err) {
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