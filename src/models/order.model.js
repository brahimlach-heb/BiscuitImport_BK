const db = require('../config/database');

// Create table orders and order_line
db.run(`CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'PENDING',
  total REAL NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS order_line (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL NOT NULL,
  discount_percent REAL DEFAULT 0,
  final_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES product(id)
)`);

// Try to add columns if missing (for migrations)
const tryAddColumn = (sql) => {
  db.run(sql, (err) => {
    // ignore error (column exists)
  });
};

tryAddColumn("ALTER TABLE order_line ADD COLUMN discount_percent REAL DEFAULT 0");
tryAddColumn("ALTER TABLE order_line ADD COLUMN final_price REAL");

const createOrder = async ({ user_id, total, status = 'PENDING', lines = [] }) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (bErr) => {
      if (bErr) return reject(bErr);
      const sql = 'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)';
      db.run(sql, [user_id, total, status], function (err) {
        if (err) {
          db.run('ROLLBACK');
          return reject(err);
        }
        const orderId = this.lastID;
        // insert lines sequentially
        const insertLine = (i) => {
          if (i >= lines.length) {
            db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err2, row) => {
              if (err2) {
                db.run('ROLLBACK');
                return reject(err2);
              }
              db.run('COMMIT', () => resolve(row));
            });
            return;
          }
          const ln = lines[i];
          const sqlLine = 'INSERT INTO order_line (order_id, product_id, quantity, unit_price, discount_percent, final_price) VALUES (?, ?, ?, ?, ?, ?)';
          db.run(sqlLine, [orderId, ln.product_id, ln.quantity || 1, ln.unit_price, ln.discount_percent || 0, ln.final_price], function (err3) {
            if (err3) {
              db.run('ROLLBACK');
              return reject(err3);
            }
            insertLine(i + 1);
          });
        };
        insertLine(0);
      });
    });
  });
};

const getOrderById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
      if (err) return reject(err);
      if (!order) return resolve(null);
      db.all('SELECT ol.*, p.name, p.image FROM order_line ol LEFT JOIN product p ON p.id = ol.product_id WHERE ol.order_id = ?', [id], (err2, lines) => {
        if (err2) return reject(err2);
        order.lines = lines || [];
        resolve(order);
      });
    });
  });
};

const getOrdersByUser = (user_id) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM orders WHERE user_id = ?', [user_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = {
  createOrder,
  getOrderById,
  getOrdersByUser
};