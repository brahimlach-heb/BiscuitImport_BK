const productModel = require('../models/product.model');
const productPriceRoleModel = require('../models/product_price_role.model');
const flavorModel = require('../models/flavor.model');
const historyModel = require('../models/history.model');
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

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addFlavorToProduct,
  removeFlavorFromProduct
};