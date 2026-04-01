const db = require('../config/database');

// Create table supplier_returns
db.run(`CREATE TABLE IF NOT EXISTS supplier_returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_order_id INTEGER NOT NULL,
  supplier_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  return_reason TEXT,
  return_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  credit_amount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
)`);

// Create table supplier_return_items
db.run(`CREATE TABLE IF NOT EXISTS supplier_return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_return_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER,
  unit_price REAL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_return_id) REFERENCES supplier_returns(id),
  FOREIGN KEY (product_id) REFERENCES product(id)
)`);

const createSupplierReturn = (data) => {
  return new Promise((resolve, reject) => {
    const { purchase_order_id, supplier_id, return_reason } = data;
    
    // If supplier_id not provided, fetch it from purchase_orders
    if (!supplier_id) {
      db.get('SELECT supplier_id FROM purchase_orders WHERE id = ?', [purchase_order_id], (err, po) => {
        if (err) return reject(err);
        if (!po) return reject(new Error('Purchase order not found'));
        
        const sql = `INSERT INTO supplier_returns (purchase_order_id, supplier_id, status, return_reason)
                     VALUES (?, ?, 'pending', ?)`;
        db.run(sql, [purchase_order_id, po.supplier_id, return_reason || null], function (err) {
          if (err) return reject(err);
          getSupplierReturnById(this.lastID).then(resolve).catch(reject);
        });
      });
    } else {
      const sql = `INSERT INTO supplier_returns (purchase_order_id, supplier_id, status, return_reason)
                   VALUES (?, ?, 'pending', ?)`;
      db.run(sql, [purchase_order_id, supplier_id, return_reason || null], function (err) {
        if (err) return reject(err);
        getSupplierReturnById(this.lastID).then(resolve).catch(reject);
      });
    }
  });
};

const getSupplierReturnById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM supplier_returns WHERE id = ?', [id], async (err, row) => {
      if (err) return reject(err);
      if (row) {
        try {
          row.items = await getSupplierReturnItems(id);
        } catch (e) {
          row.items = [];
        }
      }
      resolve(row);
    });
  });
};

const getSupplierReturns = (filter = {}) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT sr.*, s.name as supplier_name, po.status as po_status 
               FROM supplier_returns sr
               LEFT JOIN suppliers s ON sr.supplier_id = s.id
               LEFT JOIN purchase_orders po ON sr.purchase_order_id = po.id
               WHERE 1=1`;
    const params = [];

    if (filter.purchase_order_id) {
      sql += ' AND sr.purchase_order_id = ?';
      params.push(filter.purchase_order_id);
    }
    if (filter.supplier_id) {
      sql += ' AND sr.supplier_id = ?';
      params.push(filter.supplier_id);
    }
    if (filter.status) {
      sql += ' AND sr.status = ?';
      params.push(filter.status);
    }
    if (filter.search) {
      sql += ' AND s.name LIKE ?';
      params.push(`%${filter.search}%`);
    }

    sql += ' ORDER BY sr.created_at DESC';

    db.all(sql, params, async (err, rows) => {
      if (err) return reject(err);
      
      // Load items for each return
      try {
        const rowsWithItems = await Promise.all(rows.map(async (row) => {
          try {
            row.items = await getSupplierReturnItems(row.id);
          } catch (e) {
            row.items = [];
          }
          return row;
        }));
        resolve(rowsWithItems || []);
      } catch (e) {
        reject(e);
      }
    });
  });
};

const updateSupplierReturn = (id, data) => {
  return new Promise((resolve, reject) => {
    // Check if status is pending before allowing update
    db.get('SELECT status FROM supplier_returns WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (row && row.status !== 'pending') {
        return reject(new Error('Can only modify pending returns'));
      }

      const { return_reason } = data;
      const sql = `UPDATE supplier_returns SET return_reason = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      db.run(sql, [return_reason || null, id], (err) => {
        if (err) return reject(err);
        getSupplierReturnById(id).then(resolve).catch(reject);
      });
    });
  });
};

const updateSupplierReturnStatus = (id, status, credit_amount) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE supplier_returns SET status = ?, credit_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [status, credit_amount || 0, id], (err) => {
      if (err) return reject(err);
      getSupplierReturnById(id).then(resolve).catch(reject);
    });
  });
};

const deleteSupplierReturn = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT status FROM supplier_returns WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      if (row && row.status !== 'pending') {
        return reject(new Error('Can only delete pending returns'));
      }

      db.run('DELETE FROM supplier_return_items WHERE supplier_return_id = ?', [id], (err) => {
        if (err) return reject(err);
        db.run('DELETE FROM supplier_returns WHERE id = ?', [id], (err) => {
          if (err) return reject(err);
          resolve({ success: true });
        });
      });
    });
  });
};

const addSupplierReturnItem = (data) => {
  return new Promise((resolve, reject) => {
    const { supplier_return_id, product_id, quantity, unit_price, reason } = data;
    const sql = `INSERT INTO supplier_return_items (supplier_return_id, product_id, quantity, unit_price, reason)
                 VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [supplier_return_id, product_id, quantity || 0, unit_price || 0, reason || null], function (err) {
      if (err) return reject(err);
      getSupplierReturnItem(this.lastID).then(resolve).catch(reject);
    });
  });
};

const getSupplierReturnItem = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM supplier_return_items WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const getSupplierReturnItems = (supplier_return_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT sri.*, p.name as product_name 
                 FROM supplier_return_items sri
                 LEFT JOIN product p ON sri.product_id = p.id
                 WHERE sri.supplier_return_id = ?
                 ORDER BY sri.created_at ASC`;
    db.all(sql, [supplier_return_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
};

module.exports = {
  createSupplierReturn,
  getSupplierReturnById,
  getSupplierReturns,
  updateSupplierReturn,
  updateSupplierReturnStatus,
  deleteSupplierReturn,
  addSupplierReturnItem,
  getSupplierReturnItem,
  getSupplierReturnItems
};
