const db = require('../config/database');

// Create table stock_movements
db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  reference_type TEXT,
  reference_id INTEGER,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES product(id),
  FOREIGN KEY (created_by) REFERENCES user(id)
)`);

const createStockMovement = (data) => {
  return new Promise((resolve, reject) => {
    const { product_id, type, quantity_before, quantity_after, reference_type, reference_id, notes, created_by } = data;
    const sql = `INSERT INTO stock_movements (product_id, type, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [product_id, type, quantity_before || 0, quantity_after || 0, reference_type || null, reference_id || null, notes || null, created_by || null], function (err) {
      if (err) return reject(err);
      getStockMovementById(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getStockMovementById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT sm.*, p.name as product_name 
            FROM stock_movements sm
            LEFT JOIN product p ON sm.product_id = p.id
            WHERE sm.id = ?`, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getStockMovements = (filter = {}) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT sm.*, p.name as product_name 
               FROM stock_movements sm
               LEFT JOIN product p ON sm.product_id = p.id
               WHERE 1=1`;
    const params = [];

    if (filter.product_id) {
      sql += ' AND sm.product_id = ?';
      params.push(filter.product_id);
    }
    if (filter.type) {
      sql += ' AND sm.type = ?';
      params.push(filter.type);
    }
    if (filter.reference_type) {
      sql += ' AND sm.reference_type = ?';
      params.push(filter.reference_type);
    }
    if (filter.reference_id) {
      sql += ' AND sm.reference_id = ?';
      params.push(filter.reference_id);
    }

    sql += ' ORDER BY sm.created_at DESC';

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const getStockMovementsByProduct = (product_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT sm.*, p.name as product_name 
                 FROM stock_movements sm
                 LEFT JOIN product p ON sm.product_id = p.id
                 WHERE sm.product_id = ?
                 ORDER BY sm.created_at DESC`;
    db.all(sql, [product_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const getAllStock = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT p.id, p.name, p.price, p.stock, p.stock_securite, p.category_id, c.name as category_name
                 FROM product p
                 LEFT JOIN category c ON p.category_id = c.id
                 WHERE p.is_active = 1
                 ORDER BY p.name ASC`;
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const getStockLowAlerts = (threshold) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT p.id, p.name, p.stock, p.stock_securite, (p.stock_securite - p.stock) as deficit
                 FROM product p
                 WHERE p.is_active = 1 AND p.stock <= ?
                 ORDER BY deficit DESC`;
    db.all(sql, [threshold || 10], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

const updateStock = (product_id, quantity_change, reference_type, reference_id, notes, created_by) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT stock FROM product WHERE id = ?', [product_id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Product not found'));

      const quantity_before = row.stock;
      const quantity_after = quantity_before + (quantity_change || 0);

      // Update product stock
      db.run('UPDATE product SET stock = ? WHERE id = ?', [quantity_after, product_id], (err) => {
        if (err) return reject(err);

        // Create stock movement record
        const moveData = {
          product_id,
          type: quantity_change > 0 ? 'in' : 'out',
          quantity_before,
          quantity_after,
          reference_type,
          reference_id,
          notes,
          created_by
        };

        createStockMovement(moveData).then(resolve).catch(reject);
      });
    });
  });
};

const adjustStock = (product_id, new_quantity, reason, created_by) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT stock FROM product WHERE id = ?', [product_id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error('Product not found'));

      const quantity_before = row.stock;
      const quantity_after = new_quantity;
      const quantity_change = new_quantity - row.stock;

      // Update product stock
      db.run('UPDATE product SET stock = ? WHERE id = ?', [quantity_after, product_id], (err) => {
        if (err) return reject(err);

        // Create stock movement record
        const moveData = {
          product_id,
          type: 'adjustment',
          quantity_before,
          quantity_after,
          reference_type: 'adjustment',
          reference_id: null,
          notes: reason,
          created_by
        };

        createStockMovement(moveData).then(resolve).catch(reject);
      });
    });
  });
};

const transferStock = (from_product_id, to_product_id, quantity, reason, created_by) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) return reject(err);

        // Decrease stock from source
        db.get('SELECT stock FROM product WHERE id = ?', [from_product_id], (err, row) => {
          if (err) return reject(err);
          if (!row || row.stock < quantity) {
            return db.run('ROLLBACK', () => {
              reject(new Error('Insufficient stock for transfer'));
            });
          }

          const from_before = row.stock;
          const from_after = row.stock - quantity;

          db.run('UPDATE product SET stock = ? WHERE id = ?', [from_after, from_product_id], (err) => {
            if (err) {
              return db.run('ROLLBACK', () => reject(err));
            }

            // Get destination stock
            db.get('SELECT stock FROM product WHERE id = ?', [to_product_id], (err, row) => {
              if (err) {
                return db.run('ROLLBACK', () => reject(err));
              }

              const to_before = row?.stock || 0;
              const to_after = to_before + quantity;

              db.run('UPDATE product SET stock = ? WHERE id = ?', [to_after, to_product_id], (err) => {
                if (err) {
                  return db.run('ROLLBACK', () => reject(err));
                }

                // Create movement records
                const moveData1 = {
                  product_id: from_product_id,
                  type: 'transfer',
                  quantity_before: from_before,
                  quantity_after: from_after,
                  reference_type: 'transfer',
                  reference_id: to_product_id,
                  notes: reason,
                  created_by
                };

                const moveData2 = {
                  product_id: to_product_id,
                  type: 'transfer',
                  quantity_before: to_before,
                  quantity_after: to_after,
                  reference_type: 'transfer',
                  reference_id: from_product_id,
                  notes: reason,
                  created_by
                };

                let completed = 0;
                const errors = [];

                [moveData1, moveData2].forEach((data) => {
                  db.run(`INSERT INTO stock_movements (product_id, type, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [data.product_id, data.type, data.quantity_before, data.quantity_after, data.reference_type, data.reference_id, data.notes, data.created_by],
                    (err) => {
                      if (err) errors.push(err);
                      completed++;

                      if (completed === 2) {
                        if (errors.length > 0) {
                          return db.run('ROLLBACK', () => reject(errors[0]));
                        }
                        db.run('COMMIT', (err) => {
                          if (err) return reject(err);
                          resolve({ success: true, quantity_transferred: quantity });
                        });
                      }
                    });
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = {
  createStockMovement,
  getStockMovementById,
  getStockMovements,
  getStockMovementsByProduct,
  getAllStock,
  getStockLowAlerts,
  updateStock,
  adjustStock,
  transferStock
};
