const db = require('../config/database');
const bcrypt = require('bcrypt');

// Create table with auth fields
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  password TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  discount_percent REAL DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active INTEGER DEFAULT 1,
  deactivated_at DATETIME,
  modified_by TEXT,
  user_type TEXT DEFAULT 'candy',
  FOREIGN KEY (role_id) REFERENCES roles(id)
)`);

// Ensure columns exist (attempt to add; ignore errors if already present)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE users ADD COLUMN phone TEXT");
tryAddColumn("ALTER TABLE users ADD COLUMN address TEXT");
tryAddColumn("ALTER TABLE users ADD COLUMN password TEXT");
tryAddColumn("ALTER TABLE users ADD COLUMN role_id INTEGER");
tryAddColumn("ALTER TABLE users ADD COLUMN discount_percent REAL DEFAULT 0.00");
tryAddColumn("ALTER TABLE users ADD COLUMN last_login DATETIME");
tryAddColumn("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
tryAddColumn("ALTER TABLE users ADD COLUMN deactivated_at DATETIME");
tryAddColumn("ALTER TABLE users ADD COLUMN modified_by TEXT");
// Add modified_at column (try with and without DEFAULT to handle older SQLite versions)
tryAddColumn("ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'candy'");
tryAddColumn("ALTER TABLE users ADD COLUMN modified_at DATETIME DEFAULT CURRENT_TIMESTAMP");
tryAddColumn("ALTER TABLE users ADD COLUMN modified_at DATETIME");

// Ensure existing rows have modified_at set to created_at when NULL
db.run("UPDATE users SET modified_at = created_at WHERE modified_at IS NULL", (err) => {
  // ignore errors
});

const createUser = async ({ first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, deactivated_at, user_type }) => {
  const hash = await bcrypt.hash(password, 10);
  const deact = deactivated_at || '2099-12-31';
  
  console.log('createUser called with role_id:', role_id, 'type:', typeof role_id);
  
  // Vérifier que role_id est fourni
  if (!role_id) {
    return Promise.reject(new Error('role_id is required'));
  }
  
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO users (first_name, last_name, email, phone, address, password, role_id, discount_percent, is_active, deactivated_at, user_type, modified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
    db.run(sql, [first_name, last_name, email, phone || null, address || null, hash, role_id, discount_percent || 0.00, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : 1, deact, user_type || 'candy'], function (err) {
      if (err) return reject(err);
      const id = this.lastID;
      // return the stored row including created_at and modified_at
      db.get('SELECT id, first_name, last_name, email, phone, address, role_id, discount_percent, is_active, created_at, modified_at, deactivated_at, user_type FROM users WHERE id = ?', [id], (err2, row) => {
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
    const sql = 'SELECT id, first_name, last_name, email, phone, address, role_id, discount_percent, is_active, created_at, modified_at, last_login, deactivated_at, modified_by FROM users';
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, first_name, last_name, email, phone, address, role_id, discount_percent, is_active, created_at, modified_at, last_login, deactivated_at, modified_by FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

const updateUser = async (id, { first_name, last_name, email, phone, address, password, modified_by, role_id, discount_percent, is_active, user_type }) => {
  if (password) {
    password = await bcrypt.hash(password, 10);
  }
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, password = COALESCE(?, password), modified_by = ?, role_id = COALESCE(?, role_id), discount_percent = COALESCE(?, discount_percent), is_active = COALESCE(?, is_active), user_type = COALESCE(?, user_type), modified_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [first_name, last_name, email, phone || null, address || null, password || null, modified_by || null, role_id || null, typeof discount_percent !== 'undefined' ? discount_percent : null, typeof is_active !== 'undefined' ? (is_active ? 1 : 0) : null, user_type || null, id], function (err) {
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

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM users WHERE id = ?';
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
  updateLastLogin,
  deleteUser
};
