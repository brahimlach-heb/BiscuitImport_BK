const db = require('../config/database');
const bcrypt = require('bcrypt');

// Create table with auth fields
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  deactivated_at DATETIME,
  modified_by TEXT
)`);

// Ensure columns exist (attempt to add; ignore errors if already present)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE users ADD COLUMN phone TEXT");
tryAddColumn("ALTER TABLE users ADD COLUMN password TEXT");
tryAddColumn("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
tryAddColumn("ALTER TABLE users ADD COLUMN last_login DATETIME");
tryAddColumn("ALTER TABLE users ADD COLUMN deactivated_at DATETIME");
tryAddColumn("ALTER TABLE users ADD COLUMN modified_by TEXT");
// Add modified_at column (try with and without DEFAULT to handle older SQLite versions)
tryAddColumn("ALTER TABLE users ADD COLUMN modified_at DATETIME DEFAULT CURRENT_TIMESTAMP");
tryAddColumn("ALTER TABLE users ADD COLUMN modified_at DATETIME");

// Ensure existing rows have modified_at set to created_at when NULL
db.run("UPDATE users SET modified_at = created_at WHERE modified_at IS NULL", (err) => {
  // ignore errors
});

const createUser = async ({ first_name, last_name, email, phone, password, role, deactivated_at }) => {
  const hash = await bcrypt.hash(password, 10);
  const deact = deactivated_at || '2099-12-31';
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO users (first_name, last_name, email, phone, password, role, deactivated_at, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
    db.run(sql, [first_name, last_name, email, phone || null, hash, role || 'user', deact], function (err) {
      if (err) return reject(err);
      const id = this.lastID;
      // return the stored row including created_at and modified_at
      db.get('SELECT id, first_name, last_name, email, phone, role, created_at, modified_at, deactivated_at FROM users WHERE id = ?', [id], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const findByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, first_name, last_name, email, phone, role, created_at, modified_at, last_login, deactivated_at, modified_by FROM users';
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, first_name, last_name, email, phone, role, created_at, modified_at, last_login, deactivated_at, modified_by FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateUser = async (id, { first_name, last_name, email, phone, password, modified_by, role }) => {
  if (password) {
    password = await bcrypt.hash(password, 10);
  }
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, password = COALESCE(?, password), modified_by = ?, role = COALESCE(?, role), modified_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [first_name, last_name, email, phone || null, password || null, modified_by || null, role || null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deactivateUser = (id, modified_by) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET deactivated_at = CURRENT_TIMESTAMP, modified_by = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [modified_by || null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const updateLastLogin = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createUser,
  findByEmail,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  updateLastLogin
};
