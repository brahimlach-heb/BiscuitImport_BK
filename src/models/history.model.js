const db = require('../config/database');

// Create history table
db.run(`CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL,
  action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

// Indexes
try {
  db.run('CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_history_entity ON history(entity_type, entity_id)');
} catch (e) {
  // ignore
}

const createHistory = ({ user_id, action_type, entity_id, entity_type, description }) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO history (user_id, action_type, entity_id, entity_type, description) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [user_id, action_type, entity_id, entity_type, description || null], function (err) {
      if (err) return reject(err);
      db.get('SELECT * FROM history WHERE id = ?', [this.lastID], (err2, row) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

const getHistory = (filter = {}) => {
  return new Promise((resolve, reject) => {
    const params = [];
    let sql = 'SELECT * FROM history';
    const where = [];
    if (filter.user_id) { where.push('user_id = ?'); params.push(filter.user_id); }
    if (filter.entity_type) { where.push('entity_type = ?'); params.push(filter.entity_type); }
    if (filter.entity_id) { where.push('entity_id = ?'); params.push(filter.entity_id); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = {
  createHistory,
  getHistory
};