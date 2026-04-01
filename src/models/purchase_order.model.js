const db = require('../config/database');

// Create table purchase_orders
db.run(`CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  warehouse_id INTEGER,
  status TEXT DEFAULT 'draft',
  order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expected_delivery DATETIME,
  received_date DATETIME,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
  FOREIGN KEY (created_by) REFERENCES user(id)
)`);

// Add warehouse_id column if it doesn't exist (for existing databases)
db.run(`ALTER TABLE purchase_orders ADD COLUMN warehouse_id INTEGER`, (err) => {
  // Ignore error if column already exists
});

// Create table purchase_order_lines
db.run(`CREATE TABLE IF NOT EXISTS purchase_order_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER,
  unit_price REAL,
  total REAL,
  received_quantity INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (product_id) REFERENCES product(id)
)`);

const createPurchaseOrder = (data) => {
  return new Promise((resolve, reject) => {
    const { supplier_id, warehouse_id, expected_delivery, total_amount, notes, created_by } = data;
    const sql = `INSERT INTO purchase_orders (supplier_id, warehouse_id, status, expected_delivery, total_amount, notes, created_by)
                 VALUES (?, ?, 'draft', ?, ?, ?, ?)`;
    db.run(sql, [supplier_id, warehouse_id || null, expected_delivery || null, total_amount || 0, notes || null, created_by || null], function (err) {
      if (err) return reject(err);
      getPurchaseOrderById(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getPurchaseOrderById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT po.*, s.name as supplier_name FROM purchase_orders po LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE po.id = ?', [id], async (err, row) => {
      if (err) return reject(err);
      if (row) {
        try {
          row.lines = await getPurchaseOrderLines(id);
        } catch (e) {
          row.lines = [];
        }
      }
      resolve(row);
    });
  });
};

const getPurchaseOrders = (filter = {}) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT po.*, s.name as supplier_name 
               FROM purchase_orders po
               LEFT JOIN suppliers s ON po.supplier_id = s.id WHERE 1=1`;
    const params = [];

    if (filter.supplier_id) {
      sql += ' AND po.supplier_id = ?';
      params.push(filter.supplier_id);
    }
    if (filter.status) {
      sql += ' AND po.status = ?';
      params.push(filter.status);
    }
    if (filter.search) {
      sql += ' AND s.name LIKE ?';
      params.push(`%${filter.search}%`);
    }

    sql += ' ORDER BY po.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const updatePurchaseOrder = (id, data) => {
  return new Promise((resolve, reject) => {
    // Check if status is draft before allowing update
    db.get('SELECT status FROM purchase_orders WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Purchase order not found'));
      if (row && row.status !== 'draft') {
        return reject(new Error('Can only modify draft purchase orders'));
      }

      const { supplier_id, warehouse_id, expected_delivery, total_amount, notes } = data;
      const sql = `UPDATE purchase_orders SET supplier_id = ?, warehouse_id = ?, expected_delivery = ?, total_amount = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      const params = [supplier_id || null, warehouse_id || null, expected_delivery || null, total_amount || 0, notes || null, id];
      
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        if (this.changes === 0) {
          return reject(new Error(`No records updated for id ${id}`));
        }
        getPurchaseOrderById(id).then(resolve).catch(reject);
      });
    });
  });
};

const updatePurchaseOrderStatus = (id, status) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [status, id], (err) => {
      if (err) return reject(err);
      getPurchaseOrderById(id).then(resolve).catch(reject);
    });
  });
};

const deletePurchaseOrder = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT status FROM purchase_orders WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (row && ['draft', 'cancelled'].indexOf(row.status) === -1) {
        return reject(new Error('Can only delete draft or cancelled purchase orders'));
      }

      db.run('DELETE FROM purchase_order_lines WHERE purchase_order_id = ?', [id], (err) => {
        if (err) return reject(err);
        db.run('DELETE FROM purchase_orders WHERE id = ?', [id], (err) => {
          if (err) return reject(err);
          resolve({ success: true });
        });
      });
    });
  });
};

const addPurchaseOrderLine = (data) => {
  return new Promise((resolve, reject) => {
    const { purchase_order_id, product_id, quantity, unit_price, received_quantity } = data;
    const total = (quantity || 0) * (unit_price || 0);
    const sql = `INSERT INTO purchase_order_lines (purchase_order_id, product_id, quantity, unit_price, total, received_quantity)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [purchase_order_id, product_id, quantity || 0, unit_price || 0, total, received_quantity || 0], function (err) {
      if (err) return reject(err);
      // Update total in purchase_orders
      db.get('SELECT SUM(total) as total FROM purchase_order_lines WHERE purchase_order_id = ?', [purchase_order_id], (err, row) => {
        if (!err && row) {
          db.run('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [row.total || 0, purchase_order_id]);
        }
      });
      getPurchaseOrderLine(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getPurchaseOrderLine = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM purchase_order_lines WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getPurchaseOrderLines = (purchase_order_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT pl.*, p.name as product_name 
                 FROM purchase_order_lines pl
                 LEFT JOIN product p ON pl.product_id = p.id
                 WHERE pl.purchase_order_id = ?
                 ORDER BY pl.created_at ASC`;
    db.all(sql, [purchase_order_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const deletePurchaseOrderLine = (lineId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT purchase_order_id FROM purchase_order_lines WHERE id = ?', [lineId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Line not found'));

      db.run('DELETE FROM purchase_order_lines WHERE id = ?', [lineId], (err) => {
        if (err) return reject(err);
        // Update total
        const purchase_order_id = row.purchase_order_id;
        db.get('SELECT SUM(total) as total FROM purchase_order_lines WHERE purchase_order_id = ?', [purchase_order_id], (err, row) => {
          if (!err) {
            db.run('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [row?.total || 0, purchase_order_id]);
          }
        });
        resolve({ success: true });
      });
    });
  });
};

const deletePurchaseOrderlines = (purchase_order_id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM purchase_order_lines WHERE purchase_order_id = ?', [purchase_order_id], (err) => {
      if (err) return reject(err);
      db.run('UPDATE purchase_orders SET total_amount = 0 WHERE id = ?', [purchase_order_id], (err) => {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  });
};

const receivePurchaseOrder = (id, receivedItems) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) return reject(err);

        // If no items to receive, skip line updates
        if (!receivedItems || receivedItems.length === 0) {
          db.run('UPDATE purchase_orders SET status = ?, received_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['received', id], (err) => {
            if (err) {
              return db.run('ROLLBACK', () => reject(err));
            }

            db.run('COMMIT', (err) => {
              if (err) return reject(err);
              getPurchaseOrderById(id).then(resolve).catch(reject);
            });
          });
          return;
        }

        // Update received_quantity for each line
        let completed = 0;
        const errors = [];

        receivedItems.forEach((item) => {
          db.run('UPDATE purchase_order_lines SET received_quantity = ? WHERE id = ?', 
            [item.received_quantity, item.line_id], (err) => {
            if (err) errors.push(err);
            completed++;

            if (completed === receivedItems.length) {
              if (errors.length > 0) {
                return db.run('ROLLBACK', () => {
                  reject(errors[0]);
                });
              }

              // Update PO status and received_date
              db.run('UPDATE purchase_orders SET status = ?, received_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['received', id], (err) => {
                if (err) {
                  return db.run('ROLLBACK', () => reject(err));
                }

                db.run('COMMIT', (err) => {
                  if (err) return reject(err);
                  getPurchaseOrderById(id).then(resolve).catch(reject);
                });
              });
            }
          });
        });
      });
    });
  });
};

module.exports = {
  createPurchaseOrder,
  getPurchaseOrderById,
  getPurchaseOrders,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
  addPurchaseOrderLine,
  getPurchaseOrderLine,
  getPurchaseOrderLines,
  deletePurchaseOrderLine,
  deletePurchaseOrderlines,
  receivePurchaseOrder
};
