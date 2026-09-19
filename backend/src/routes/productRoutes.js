const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Search products
router.get('/products/search', productController.searchProducts);

// Tracked products
router.get('/tracked-products', productController.getTrackedProducts);
router.post('/tracked-products', productController.trackProduct);
router.get('/tracked-products/:id', productController.getTrackedProduct);

// History and logs
router.get('/tracked-products/:id/history', productController.getProductHistory);
router.get('/tracked-products/:id/logs', productController.getProductLogs);

// Scraping triggers
router.post('/scrape', productController.manualScrape);
router.get('/cron/scrape', productController.cronScrape);
router.post('/cron/scrape', productController.cronScrape); // Allow POST as well

module.exports = router;
