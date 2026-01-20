const db = require('../config/database');

// Create table category
db.run(`CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  is_active INTEGER DEFAULT 1
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE category ADD COLUMN emoji TEXT");

const createCategory = ({ name, description, emoji, is_active }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO category (name, description, emoji, is_active) VALUES (?, ?, ?, COALESCE(?, 1))';
    db.run(sql, [name, description || null, emoji || null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM category WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getAllCategories = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM category', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getCategoryById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM category WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateCategory = (id, { name, description, emoji, is_active }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE category SET name = COALESCE(?, name), description = COALESCE(?, description), emoji = COALESCE(?, emoji), is_active = COALESCE(?, is_active) WHERE id = ?';
    db.run(sql, [name || null, description || null, emoji || null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteCategory = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM category WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
};