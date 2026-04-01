const ExcelJS = require('exceljs');
/**
 * Export all products to Excel with intuitive cell design
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportProductsToExcel = async () => {
  let products = await productModel.getAllProducts({ includeInactive: true });
  // Pour chaque produit, récupérer les flavors et price roles
  for (const product of products) {
    product.flavors = await productModel.getFlavorsForProduct(product.id);
    product.price_roles = await productPriceRoleModel.getAllPricesForProduct(product.id);
  }
  // Sort by product id ascending
  products = (products || []).sort((a, b) => a.id - b.id);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Produits');

  // Header row with style
  worksheet.columns = [
    { header: 'Nom', key: 'nom', width: 25 },
    { header: 'Prix', key: 'prix', width: 12 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Categorie', key: 'categorie', width: 12 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Marque', key: 'marque', width: 15 },
    { header: 'Ingredients', key: 'ingredients', width: 30 },
    { header: 'PackageUnit', key: 'packageunit', width: 12 },
    { header: 'Flavors', key: 'flavors', width: 30 },
    { header: 'Flavors_Descriptions', key: 'flavors_descriptions', width: 40 },
    { header: 'Flavors_Images', key: 'flavors_images', width: 40 },
    { header: 'PriceRoles_Codes', key: 'priceroles_codes', width: 30 },
    { header: 'PriceRoles_Prices', key: 'priceroles_prices', width: 30 },
  ];
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF007ACC' }
  };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'center', wrapText: true };

  // Add product rows
  products.forEach((product, idx) => {
    const flavorNames = (product.flavors || []).map(f => f.name).join(',');
    const flavorDescriptions = (product.flavors || []).map(f => f.description || '').join('/');
    const flavorImages = (product.flavors || []).map(f => f.image || '').join('/');
    const roleCodes = (product.price_roles || []).map(pr => pr.code).join(',');
    const rolePrices = (product.price_roles || []).map(pr => pr.price).join(',');

    worksheet.addRow({
      nom: product.name,
      prix: product.price,
      stock: product.stock || 0,
      categorie: product.category_id || '',
      description: product.description || '',
      marque: product.marque || '',
      ingredients: product.ingredients || '',
      packageunit: product.packageUnit || 1,
      flavors: flavorNames,
      flavors_descriptions: flavorDescriptions,
      flavors_images: flavorImages,
      priceroles_codes: roleCodes,
      priceroles_prices: rolePrices
    });
    
    // Alternate row color for better readability
    const row = worksheet.getRow(idx + 2);
    if ((idx + 1) % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F7FF' }
      };
    }
  });

  // Borders for all cells
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (row.number > 1) {
        cell.alignment = { vertical: 'top', wrapText: true };
      }
    });
  });

  // Auto filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'M1',
  };

  // Return as buffer
  return workbook.xlsx.writeBuffer();
};
/**
 * Import products from Excel buffer
 * @param {Buffer} buffer
 * @param {number|null} actorUserId
 * @returns {Promise<{created: number, errors: Array<{row: number, message: string}>, errorFileUrl?: string}>}
 */
const importProductsFromExcel = async (buffer, actorUserId) => {
  if (!buffer) {
    const err = new Error('Excel file is required');
    err.status = 400;
    throw err;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    const err = new Error('No worksheet found in Excel file');
    err.status = 400;
    throw err;
  }

  const normalizeHeader = (value) => {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  const getCellValue = (cell) => {
    if (!cell) return '';
    if (typeof cell.text === 'string' && cell.text.trim() !== '') return cell.text.trim();
    if (cell.value === null || typeof cell.value === 'undefined') return '';
    if (typeof cell.value === 'object' && cell.value.text) return String(cell.value.text).trim();
    return String(cell.value).trim();
  };

  const parseNumber = (value) => {
    if (value === '') return null;
    const num = Number(String(value).replace(',', '.'));
    return Number.isFinite(num) ? num : null;
  };

  const headerRow = worksheet.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colNumber) => {
    const key = normalizeHeader(getCellValue(cell));
    if (key) headerMap[key] = colNumber;
  });

  const requiredHeaders = [
    'nom',
    'prix',
    'stock',
    'categorie',
    'description',
    'marque',
    'ingredients',
    'packageunit',
    'flavors',
    'flavors_descriptions',
    'flavors_images'
  ];

  const headerAliases = {
    categorie: ['categorie', 'category', 'category_id'],
    flavors_descriptions: ['flavors_descriptions', 'flavors_description', 'flavor_descriptions'],
    flavors_images: ['flavors_images', 'flavors_image', 'flavor_images'],
    priceroles_codes: ['priceroles_codes', 'price_roles_codes', 'price_roles_code'],
    priceroles_prices: ['priceroles_prices', 'price_roles_prices', 'price_roles_price']
  };

  const getByHeader = (row, headerKey) => {
    const aliases = headerAliases[headerKey] || [headerKey];
    for (const key of aliases) {
      const col = headerMap[key];
      if (col) return getCellValue(row.getCell(col));
    }
    return '';
  };

  const errors = [];
  let created = 0;
  const errorColumnIndex = headerRow.cellCount + 1;
  headerRow.getCell(errorColumnIndex).value = 'Import_Erreur';
  headerRow.commit();

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    const name = getByHeader(row, 'nom');
    const priceValue = getByHeader(row, 'prix');
    const rowHasData = row.values && row.values.some((val, idx) => idx > 0 && val !== null && typeof val !== 'undefined' && String(val).trim() !== '');
    if (!rowHasData) {
      continue;
    }
    const price = parseNumber(priceValue);

    const rowErrors = [];

    for (const headerKey of requiredHeaders) {
      const value = getByHeader(row, headerKey);
      if (!value) {
        rowErrors.push(`Champ obligatoire manquant: ${headerKey}`);
      }
    }

    const stock = parseNumber(getByHeader(row, 'stock'));
    const categoryId = parseNumber(getByHeader(row, 'categorie'));
    const description = getByHeader(row, 'description');
    const marque = getByHeader(row, 'marque');
    const ingredients = getByHeader(row, 'ingredients');
    const packageUnit = parseNumber(getByHeader(row, 'packageunit'));

    if (price === null) rowErrors.push('Prix invalide');
    if (stock === null) rowErrors.push('Stock invalide');
    if (categoryId === null) rowErrors.push('Categorie invalide');
    if (!description) rowErrors.push('Description est obligatoire');
    if (!marque) rowErrors.push('Marque est obligatoire');
    if (!ingredients) rowErrors.push('Ingredients est obligatoire');
    if (packageUnit === null) rowErrors.push('PackageUnit invalide');

    const flavorNames = getByHeader(row, 'flavors');
    const flavorDescriptions = getByHeader(row, 'flavors_descriptions');
    const flavorImages = getByHeader(row, 'flavors_images');

    const flavorNameList = flavorNames ? flavorNames.split(',').map(v => v.trim()).filter(Boolean) : [];
    const flavorDescList = flavorDescriptions ? flavorDescriptions.split('/').map(v => v.trim()).filter(Boolean) : [];
    const flavorImageList = flavorImages ? flavorImages.split('/').map(v => v.trim()).filter(Boolean) : [];

    if (flavorNameList.length === 0) {
      rowErrors.push('Flavors est obligatoire');
    }
    if (flavorDescList.length !== flavorNameList.length) {
      rowErrors.push('Flavors_Descriptions doit correspondre a Flavors (meme longueur)');
    }
    if (flavorImageList.length !== flavorNameList.length) {
      rowErrors.push('Flavors_Images doit correspondre a Flavors (meme longueur)');
    }

    if (flavorNameList.some((nameValue, index) => !flavorDescList[index] || !flavorImageList[index])) {
      rowErrors.push('Chaque flavor doit avoir description et image');
    }

    const flavors = flavorNameList.map((flavorName, index) => {
      return {
        name: flavorName,
        description: flavorDescList[index] || null,
        image: flavorImageList[index] || null
      };
    });

    const priceRoleCodes = getByHeader(row, 'priceroles_codes');
    const priceRolePrices = getByHeader(row, 'priceroles_prices');
    const roleCodes = priceRoleCodes ? priceRoleCodes.split(',').map(v => v.trim()).filter(Boolean) : [];
    const rolePrices = priceRolePrices ? priceRolePrices.split(',').map(v => v.trim()).filter(Boolean) : [];

    if ((roleCodes.length > 0 || rolePrices.length > 0) && roleCodes.length !== rolePrices.length) {
      rowErrors.push('PriceRoles_Codes et PriceRoles_Prices doivent avoir la meme longueur');
    }

    if (rowErrors.length > 0) {
      const message = rowErrors.join(' | ');
      errors.push({ row: i, message });
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }
        };
      });
      row.getCell(errorColumnIndex).value = message;
      row.commit();
      continue;
    }

    const price_roles = [];
    let roleError = false;
    for (let r = 0; r < roleCodes.length; r += 1) {
      const code = roleCodes[r];
      const rolePrice = parseNumber(rolePrices[r]);
      if (!code || rolePrice === null) {
        const message = `Prix role invalide pour code ${code}`;
        errors.push({ row: i, message });
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' }
          };
        });
        row.getCell(errorColumnIndex).value = message;
        row.commit();
        roleError = true;
        break;
      }
      const role = await roleService.getRoleByCode(code);
      if (!role) {
        const message = `Role introuvable: ${code}`;
        errors.push({ row: i, message });
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFC7CE' }
          };
        });
        row.getCell(errorColumnIndex).value = message;
        row.commit();
        roleError = true;
        break;
      }
      price_roles.push({ role_id: role.id, price: rolePrice });
    }

    if (roleError) {
      continue;
    }

    try {
      await createProduct({
        name,
        price,
        stock: stock !== null ? stock : undefined,
        category_id: categoryId !== null ? categoryId : undefined,
        description: description || undefined,
        marque: marque || undefined,
        ingredients: ingredients || undefined,
        packageUnit: packageUnit !== null ? packageUnit : undefined,
        flavors: flavors.length > 0 ? flavors : undefined,
        price_roles: price_roles.length > 0 ? price_roles : undefined
      }, actorUserId);
      created += 1;
    } catch (err) {
      const message = err.message;
      errors.push({ row: i, message });
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' }
        };
      });
      row.getCell(errorColumnIndex).value = message;
      row.commit();
    }
  }

  let errorFileUrl;
  if (errors.length > 0) {
    const importDir = path.join(process.cwd(), 'uploads', 'imports');
    fs.mkdirSync(importDir, { recursive: true });
    const fileName = `import-errors-${Date.now()}.xlsx`;
    const filePath = path.join(importDir, fileName);
    await workbook.xlsx.writeFile(filePath);
    errorFileUrl = `${BASE_URL}/uploads/imports/${fileName}`;
  }

  return { created, errors, ...(errorFileUrl ? { errorFileUrl } : {}) };
};
const productModel = require('../models/product.model');
const productPriceRoleModel = require('../models/product_price_role.model');
const flavorModel = require('../models/flavor.model');
const historyModel = require('../models/history.model');
const roleService = require('../services/role.service');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');
const { BASE_URL } = require('../config/env');

const flavorUploadDir = path.join(process.cwd(), 'uploads', 'flavors');

const ensureFlavorUploadDir = () => {
  fs.mkdirSync(flavorUploadDir, { recursive: true });
  return flavorUploadDir;
};

const saveImageAndReturnUrl = (imageInput, flavorName) => {
  if (!imageInput) return null;
  const dataUriMatch = /^data:(image\/[-+\.\w]+);base64,(.+)$/i.exec(imageInput);
  if (!dataUriMatch) {
    // Already a URL or path
    return imageInput;
  }

  const mimeType = dataUriMatch[1];
  const ext = (mimeType.split('/')?.[1] || 'png').split('+')[0];
  const safeName = (flavorName || 'flavor').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'flavor';
  const fileName = `${Date.now()}-${safeName}.${ext}`;
  const buffer = Buffer.from(dataUriMatch[2], 'base64');
  const dir = ensureFlavorUploadDir();
  fs.writeFileSync(path.join(dir, fileName), buffer);
  return `${BASE_URL}/uploads/flavors/${fileName}`;
};

const createProduct = async (data, actorUserId) => {
  if (!data || !data.name || typeof data.price === 'undefined') {
    const err = new Error('Name and price are required');
    err.status = 400;
    throw err;
  }
  logger.info(`DB createProduct: name=${data.name} price=${data.price} actor=${actorUserId || 'system'}`);
  
  const { price_roles, flavors, ...productData } = data;
  const prod = await productModel.createProduct(productData);
  
  // Créer les flavors si fournis
  if (flavors && Array.isArray(flavors)) {
    for (const flavor of flavors) {
      if (flavor.name) {
        // Traiter l'image si c'est un base64
        const imageUrl = saveImageAndReturnUrl(flavor.image, flavor.name);
        const createdFlavor = await flavorModel.createFlavor({
          name: flavor.name,
          description: flavor.description,
          color: flavor.color,
          image: imageUrl,
          product_id: prod.id
        });
        // Associer le flavor au produit
        await productModel.addFlavorToProduct(prod.id, createdFlavor.id);
      }
    }
  }
  
  // Ajouter les prix par rôle si fournis
  if (price_roles && Array.isArray(price_roles)) {
    for (const priceRole of price_roles) {
      if (priceRole.role_id && typeof priceRole.price !== 'undefined') {
        await productPriceRoleModel.createProductPriceRole({
          product_id: prod.id,
          role_id: priceRole.role_id,
          price: priceRole.price
        });
      }
    }
  }
  
  if (actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'ADD_PRODUCT', entity_id: prod.id, entity_type: 'PRODUCT', description: JSON.stringify(prod) });
    logger.info(`AUDIT ADD_PRODUCT: id=${prod.id} user=${actorUserId}`);
  }
  return prod;
};

const getAllProducts = async (filter, roleId, roleCode) => {
  logger.info(`DB getAllProducts: filter=${JSON.stringify(filter)} roleId=${roleId} roleCode=${roleCode}`);
  
  // ADMIN et MANAGER peuvent voir tous les produits, sinon seulement les actifs
  const isAdminOrManager = roleCode && (roleCode.toUpperCase() === 'ADMIN' || roleCode.toUpperCase() === 'MANAGER');
  const filterWithActive = { ...filter, includeInactive: isAdminOrManager };
  
  const products = await productModel.getAllProducts(filterWithActive);
  
  if (products && Array.isArray(products)) {
    for (const product of products) {
      // Récupérer les flavors pour chaque produit
      product.flavors = await productModel.getFlavorsForProduct(product.id);
      
      // Ajouter l'URL complète du serveur pour les images des flavors et filtrer les champs
      if (product.flavors && Array.isArray(product.flavors)) {
        product.flavors = product.flavors.map(flavor => {
          const imageUrl = flavor.image && !flavor.image.startsWith('http') 
            ? `${BASE_URL}${flavor.image.startsWith('/') ? '' : '/'}${flavor.image}`
            : flavor.image;
          
          return {
            id: flavor.id,
            name: flavor.name,
            color: flavor.color,
            image: imageUrl
          };
        });
      }
      
      // Si un roleId est fourni, récupérer le prix spécifique pour ce rôle
      if (roleId) {
        logger.info(`Checking price for product ${product.id} with roleId ${roleId}`);
        const rolePrice = await productPriceRoleModel.getProductPriceByRole(product.id, roleId);
        logger.info(`Product ${product.id} - rolePrice: ${JSON.stringify(rolePrice)}`);
        if (rolePrice && typeof rolePrice.price !== 'undefined' && rolePrice.price !== null) {
          product.price = rolePrice.price;
          logger.info(`Price updated for product ${product.id}: ${product.price}`);
        } else {
          logger.info(`No role price found for product ${product.id}, keeping default price: ${product.price}`);
        }
      } else {
        logger.info(`No roleId provided, using default prices`);
      }
    }
  }
  
  return products;
};

const getProductById = async (id) => {
  logger.debug(`DB getProductById: id=${id}`);
  const prod = await productModel.getProductById(id);
  if (!prod) return null;
  prod.flavors = await productModel.getFlavorsForProduct(id);
  
  // Ajouter l'URL complète du serveur pour les images des flavors et filtrer les champs
  if (prod.flavors && Array.isArray(prod.flavors)) {
    prod.flavors = prod.flavors.map(flavor => {
      const imageUrl = flavor.image && !flavor.image.startsWith('http') 
        ? `${BASE_URL}${flavor.image.startsWith('/') ? '' : '/'}${flavor.image}`
        : flavor.image;
      
      return {
        id: flavor.id,
        name: flavor.name,
        color: flavor.color,
        image: imageUrl
      };
    });
  }
  
  prod.price_roles = await productPriceRoleModel.getAllPricesForProduct(id);
  return prod;
};

const updateProduct = async (id, data, actorUserId) => {
  logger.info(`DB updateProduct: id=${id} actor=${actorUserId || 'system'}`);
  
  const { price_roles, flavors, ...productData } = data;
  const updated = await productModel.updateProduct(id, productData);
  
  // Mettre à jour les flavors si fournis
  if (updated && flavors && Array.isArray(flavors)) {
    // Supprimer les anciennes associations
    const existingFlavors = await productModel.getFlavorsForProduct(id);
    for (const flavor of existingFlavors) {
      await productModel.removeFlavorFromProduct(id, flavor.id);
    }
    // Créer et associer les nouveaux flavors
    for (const flavor of flavors) {
      if (flavor.name) {
        // Traiter l'image si c'est un base64
        const imageUrl = saveImageAndReturnUrl(flavor.image, flavor.name);
        const createdFlavor = await flavorModel.createFlavor({
          name: flavor.name,
          description: flavor.description,
          color: flavor.color,
          image: imageUrl,
          product_id: id
        });
        await productModel.addFlavorToProduct(id, createdFlavor.id);
      }
    }
  }
  
  // Mettre à jour les prix par rôle si fournis
  if (updated && price_roles && Array.isArray(price_roles)) {
    // Supprimer les anciens prix
    await productPriceRoleModel.deleteAllPricesForProduct(id);
    // Ajouter les nouveaux prix
    for (const priceRole of price_roles) {
      if (priceRole.role_id && typeof priceRole.price !== 'undefined') {
        await productPriceRoleModel.createProductPriceRole({
          product_id: id,
          role_id: priceRole.role_id,
          price: priceRole.price
        });
      }
    }
  }
  
  if (updated && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'UPDATE_PRODUCT', entity_id: id, entity_type: 'PRODUCT', description: JSON.stringify(data) });
    logger.info(`AUDIT UPDATE_PRODUCT: id=${id} user=${actorUserId}`);
  }
  return updated;
};

const deleteProduct = async (id, actorUserId) => {
  logger.info(`DB deleteProduct: id=${id} actor=${actorUserId || 'system'}`);
  const deleted = await productModel.deleteProduct(id);
  if (deleted && actorUserId) {
    await historyModel.createHistory({ user_id: actorUserId, action_type: 'DELETE_PRODUCT', entity_id: id, entity_type: 'PRODUCT' });
    logger.info(`AUDIT DELETE_PRODUCT: id=${id} user=${actorUserId}`);
  }
  return deleted;
};

const addFlavorToProduct = async (product_id, flavor_id) => {
  logger.info(`DB addFlavorToProduct: product_id=${product_id} flavor_id=${flavor_id}`);
  return await productModel.addFlavorToProduct(product_id, flavor_id);
};

const removeFlavorFromProduct = async (product_id, flavor_id) => {
  logger.info(`DB removeFlavorFromProduct: product_id=${product_id} flavor_id=${flavor_id}`);
  return await productModel.removeFlavorFromProduct(product_id, flavor_id);
};

const updateSecurityStock = async (product_id, stock_securite) => {
  logger.info(`DB updateSecurityStock: product_id=${product_id} stock_securite=${stock_securite}`);
  return await productModel.updateSecurityStock(product_id, stock_securite);
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addFlavorToProduct,
  removeFlavorFromProduct,
  updateSecurityStock,
  exportProductsToExcel,
  importProductsFromExcel
};