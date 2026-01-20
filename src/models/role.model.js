const db = require('../config/database');

// Create table roles
db.run(`CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  is_active INTEGER DEFAULT 1
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE roles ADD COLUMN is_active INTEGER DEFAULT 1");

// Create index on code
db.run('CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code)', (err) => {
  // ignore errors
});

const createRole = ({ code, label, is_active }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO roles (code, label, is_active) VALUES (?, ?, COALESCE(?, 1))';
    db.run(sql, [code, label || null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM roles WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getAllRoles = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM roles', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getRoleById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM roles WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const getRoleByCode = (code) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM roles WHERE code = ?', [code], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateRole = (id, { code, label, is_active }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE roles SET code = COALESCE(?, code), label = COALESCE(?, label), is_active = COALESCE(?, is_active) WHERE id = ?';
    db.run(sql, [code || null, label || null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteRole = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM roles WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  getRoleByCode,
  updateRole,
  deleteRole
};
