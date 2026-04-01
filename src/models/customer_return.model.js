const db = require('../config/database');

// Create table customer_returns
db.run(`CREATE TABLE IF NOT EXISTS customer_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  return_reason TEXT,
  return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  refund_amount REAL DEFAULT 0,
  refund_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
)`);

// Create table customer_return_items
db.run(`CREATE TABLE IF NOT EXISTS customer_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER,
  unit_price REAL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_return_id) REFERENCES customer_returns(id),
  FOREIGN KEY (product_id) REFERENCES product(id)
)`);

const createCustomerReturn = (data) => {
  return new Promise((resolve, reject) => {
    const { order_id, return_reason } = data;
    const sql = `INSERT INTO customer_returns (order_id, status, return_reason)
                 VALUES (?, 'pending', ?)`;
    db.run(sql, [order_id, return_reason || null], function (err) {
      if (err) return reject(err);
      getCustomerReturnById(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getCustomerReturnById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM customer_returns WHERE id = ?', [id], async (err, row) => {
      if (err) return reject(err);
      if (row) {
        try {
          row.items = await getCustomerReturnItems(id);
        } catch (e) {
          row.items = [];
        }
      }
      resolve(row);
    });
  });
};

const getCustomerReturns = (filter = {}) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT cr.*, o.order_number 
               FROM customer_returns cr
               LEFT JOIN orders o ON cr.order_id = o.id WHERE 1=1`;
    const params = [];

    if (filter.order_id) {
      sql += ' AND cr.order_id = ?';
      params.push(filter.order_id);
    }
    if (filter.status) {
      sql += ' AND cr.status = ?';
      params.push(filter.status);
    }
    if (filter.search) {
      sql += ' AND o.order_number LIKE ?';
      params.push(`%${filter.search}%`);
    }

    sql += ' ORDER BY cr.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const updateCustomerReturn = (id, data) => {
  return new Promise((resolve, reject) => {
    // Check if status is pending before allowing update
    db.get('SELECT status FROM customer_returns WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (row && row.status !== 'pending') {
        return reject(new Error('Can only modify pending returns'));
      }

      const { return_reason } = data;
      const sql = `UPDATE customer_returns SET return_reason = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      db.run(sql, [return_reason || null, id], (err) => {
        if (err) return reject(err);
        getCustomerReturnById(id).then(resolve).catch(reject);
      });
    });
  });
};

const updateCustomerReturnStatus = (id, status, refund_amount, refund_method) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE customer_returns SET status = ?, refund_amount = ?, refund_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [status, refund_amount || 0, refund_method || null, id], (err) => {
      if (err) return reject(err);
      getCustomerReturnById(id).then(resolve).catch(reject);
    });
  });
};

const deleteCustomerReturn = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT status FROM customer_returns WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (row && row.status !== 'pending') {
        return reject(new Error('Can only delete pending returns'));
      }

      db.run('DELETE FROM customer_return_items WHERE customer_return_id = ?', [id], (err) => {
        if (err) return reject(err);
        db.run('DELETE FROM customer_returns WHERE id = ?', [id], (err) => {
          if (err) return reject(err);
          resolve({ success: true });
        });
      });
    });
  });
};

const addCustomerReturnItem = (data) => {
  return new Promise((resolve, reject) => {
    const { customer_return_id, product_id, quantity, unit_price, reason } = data;
    const sql = `INSERT INTO customer_return_items (customer_return_id, product_id, quantity, unit_price, reason)
                 VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [customer_return_id, product_id, quantity || 0, unit_price || 0, reason || null], function (err) {
      if (err) return reject(err);
      getCustomerReturnItem(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getCustomerReturnItem = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM customer_return_items WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getCustomerReturnItems = (customer_return_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT cri.*, p.name as product_name 
                 FROM customer_return_items cri
                 LEFT JOIN product p ON cri.product_id = p.id
                 WHERE cri.customer_return_id = ?
                 ORDER BY cri.created_at ASC`;
    db.all(sql, [customer_return_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

module.exports = {
  createCustomerReturn,
  getCustomerReturnById,
  getCustomerReturns,
  updateCustomerReturn,
  updateCustomerReturnStatus,
  deleteCustomerReturn,
  addCustomerReturnItem,
  getCustomerReturnItem,
  getCustomerReturnItems
};
