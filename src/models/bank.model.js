const db = require('../config/database');

// Create table banks
db.run(`CREATE TABLE IF NOT EXISTS banks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  created_by INTEGER,
  modified_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (modified_by) REFERENCES users(id)
)`);

// Create index on code
db.run('CREATE INDEX IF NOT EXISTS idx_banks_code ON banks(code)', (err) => {
  // ignore errors
});

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE banks ADD COLUMN created_by INTEGER");
tryAddColumn("ALTER TABLE banks ADD COLUMN modified_by INTEGER");
tryAddColumn("ALTER TABLE banks ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
tryAddColumn("ALTER TABLE banks ADD COLUMN modified_at DATETIME DEFAULT CURRENT_TIMESTAMP");

const createBank = ({ code, label, created_by }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO banks (code, label, created_by) VALUES (?, ?, ?)';
    db.run(sql, [code, label, created_by || null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM banks WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getAllBanks = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM banks ORDER BY label ASC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getBankById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM banks WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const updateBank = (id, { code, label, modified_by }) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE banks SET code = ?, label = ?, modified_by = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [code, label, modified_by || null, id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

const deleteBank = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM banks WHERE id = ?', [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
};

module.exports = {
  createBank,
  getAllBanks,
  getBankById,
  updateBank,
  deleteBank
};
