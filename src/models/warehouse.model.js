const db = require('../config/database');

/**
 * Create warehouses table if it doesn't exist
 */
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      city TEXT,
      capacity INTEGER NOT NULL DEFAULT 1000,
      is_active BOOLEAN DEFAULT 1,
      soft_delete_flag BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warehouse_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_warehouse_id INTEGER NOT NULL,
      to_warehouse_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_by INTEGER,
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS warehouse_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warehouse_id INTEGER NOT NULL UNIQUE,
      total_stock INTEGER DEFAULT 0,
      used_capacity INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    )
  `);
});

/**
 * Create warehouse
 */
const createWarehouse = (data) => {
  return new Promise((resolve, reject) => {
    const { name, location, city, capacity, is_active } = data;
    const sql = `INSERT INTO warehouses (name, location, city, capacity, is_active) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, location, city, capacity || 1000, is_active !== false ? 1 : 0], function(err) {
      if (err) return reject(err);
      
      // Create warehouse stock entry
      db.run(`INSERT INTO warehouse_stock (warehouse_id, total_stock, used_capacity) VALUES (?, 0, 0)`, [this.lastID]);
      
      getAllWarehouses({ id: this.lastID }).then(resolve).catch(reject);
    });
  });
};

/**
 * Get all warehouses with pagination
 */
const getAllWarehouses = (filter) => {
  return new Promise((resolve, reject) => {
    let where = 'WHERE w.soft_delete_flag = 0';
    const params = [];

    if (filter?.is_active !== undefined) {
      where += ' AND w.is_active = ?';
      params.push(filter.is_active ? 1 : 0);
    }

    if (filter?.id) {
      where += ' AND w.id = ?';
      params.push(filter.id);
    }

    if (filter?.search) {
      where += ' AND (LOWER(w.name) LIKE ? OR LOWER(w.location) LIKE ? OR LOWER(w.city) LIKE ?)';
      const searchTerm = `%${filter.search.toLowerCase()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter?.city) {
      where += ' AND LOWER(w.city) = ?';
      params.push(filter.city.toLowerCase());
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM warehouses w ${where}`;
    db.get(countSql, params, (err, countResult) => {
      if (err) return reject(err);

      // Get paginated data with stock info
      const sql = `
        SELECT w.*, 
               COALESCE(ws.total_stock, 0) as total_stock,
               COALESCE(ws.used_capacity, 0) as used_capacity,
               ROUND((COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity), 2) as capacity_percentage
        FROM warehouses w
        LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id
        ${where}
        ORDER BY w.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) return reject(err);
        
        const total = countResult.total;
        const pages = Math.ceil(total / limit);
        
        resolve({
          data: rows || [],
          pagination: { page, limit, total, pages }
        });
      });
    });
  });
};

/**
 * Get warehouse by ID
 */
const getWarehouseById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT w.*,
             COALESCE(ws.total_stock, 0) as total_stock,
             COALESCE(ws.used_capacity, 0) as used_capacity,
             ROUND((COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity), 2) as capacity_percentage
      FROM warehouses w
      LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id
      WHERE w.id = ? AND w.soft_delete_flag = 0
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

/**
 * Get warehouse stock status
 */
const getWarehouseStockStatus = (warehouseId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT w.id, w.name, w.capacity,
             COALESCE(ws.total_stock, 0) as total_stock,
             COALESCE(ws.used_capacity, 0) as used_capacity,
             ROUND((COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity), 2) as capacity_percentage,
             (w.capacity - COALESCE(ws.used_capacity, 0)) as available_capacity
      FROM warehouses w
      LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id
      WHERE w.id = ? AND w.soft_delete_flag = 0
    `;
    
    db.get(sql, [warehouseId], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

/**
 * Get warehouse transfers
 */
const getWarehouseTransfers = (warehouseId, filter) => {
  return new Promise((resolve, reject) => {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    const offset = (page - 1) * limit;

    let where = 'WHERE (wt.from_warehouse_id = ? OR wt.to_warehouse_id = ?)';
    const params = [warehouseId, warehouseId];

    if (filter?.status) {
      where += ' AND wt.status = ?';
      params.push(filter.status);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM warehouse_transfers wt ${where}`;
    db.get(countSql, params, (err, countResult) => {
      if (err) return reject(err);

      // Get paginated data
      const sql = `
        SELECT wt.*, 
               fw.name as from_warehouse_name,
               tw.name as to_warehouse_name,
               p.name as product_name
        FROM warehouse_transfers wt
        LEFT JOIN warehouses fw ON wt.from_warehouse_id = fw.id
        LEFT JOIN warehouses tw ON wt.to_warehouse_id = tw.id
        LEFT JOIN products p ON wt.product_id = p.id
        ${where}
        ORDER BY wt.transfer_date DESC
        LIMIT ? OFFSET ?
      `;

      db.all(sql, [...params, limit, offset], (err, rows) => {
        if (err) return reject(err);

        const total = countResult.total;
        const pages = Math.ceil(total / limit);

        resolve({
          data: rows || [],
          pagination: { page, limit, total, pages }
        });
      });
    });
  });
};

/**
 * Get warehouse capacity info
 */
const getWarehouseCapacity = (warehouseId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT w.id, w.name, w.capacity,
             COALESCE(ws.used_capacity, 0) as used_capacity,
             (w.capacity - COALESCE(ws.used_capacity, 0)) as available_capacity,
             ROUND((COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity), 2) as usage_percentage,
             CASE 
               WHEN (COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity) >= 90 THEN 'critical'
               WHEN (COALESCE(ws.used_capacity, 0) * 100.0 / w.capacity) >= 75 THEN 'warning'
               ELSE 'normal'
             END as status
      FROM warehouses w
      LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id
      WHERE w.id = ? AND w.soft_delete_flag = 0
    `;

    db.get(sql, [warehouseId], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
};

/**
 * Update warehouse
 */
const updateWarehouse = (id, data) => {
  return new Promise((resolve, reject) => {
    const { name, location, city, capacity, is_active } = data;
    const sql = `
      UPDATE warehouses 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          city = COALESCE(?, city),
          capacity = COALESCE(?, capacity),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND soft_delete_flag = 0
    `;

    db.run(sql, [name, location, city, capacity, is_active !== undefined ? (is_active ? 1 : 0) : null, id], function(err) {
      if (err) return reject(err);
      getWarehouseById(id).then(resolve).catch(reject);
    });
  });
};

/**
 * Soft delete warehouse
 */
const softDeleteWarehouse = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE warehouses SET soft_delete_flag = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(sql, [id], function(err) {
      if (err) return reject(err);
      resolve({ id, message: 'Warehouse deleted successfully' });
    });
  });
};

/**
 * Transfer stock between warehouses (TRANSACTION)
 */
const transferStock = (fromWarehouseId, toWarehouseId, productId, quantity, notes, userId) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) return reject(err);

        // Create transfer record
        const transferSql = `
          INSERT INTO warehouse_transfers 
          (from_warehouse_id, to_warehouse_id, product_id, quantity, status, notes, created_by) 
          VALUES (?, ?, ?, ?, 'completed', ?, ?)
        `;

        db.run(transferSql, [fromWarehouseId, toWarehouseId, productId, quantity, notes, userId], function(err) {
          if (err) {
            return db.run('ROLLBACK', () => reject(err));
          }

          const transferId = this.lastID;

          // Update warehouse stock
          db.run(
            `UPDATE warehouse_stock SET used_capacity = used_capacity - ? WHERE warehouse_id = ?`,
            [quantity, fromWarehouseId],
            (err) => {
              if (err) return db.run('ROLLBACK', () => reject(err));

              db.run(
                `UPDATE warehouse_stock SET used_capacity = used_capacity + ? WHERE warehouse_id = ?`,
                [quantity, toWarehouseId],
                (err) => {
                  if (err) return db.run('ROLLBACK', () => reject(err));

                  db.run('COMMIT', (err) => {
                    if (err) return reject(err);
                    resolve({ id: transferId, message: 'Stock transferred successfully' });
                  });
                }
              );
            }
          );
        });
      });
    });
  });
};

module.exports = {
  createWarehouse,
  getAllWarehouses,
  getWarehouseById,
  getWarehouseStockStatus,
  getWarehouseTransfers,
  getWarehouseCapacity,
  updateWarehouse,
  softDeleteWarehouse,
  transferStock
};
