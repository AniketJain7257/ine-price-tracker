require('dotenv').config();
const { scrapeProduct } = require('./scraper');

const productId = process.argv[2];
if (!productId) {
  console.error("Usage: npm run scrape:headed <product_id>");
  process.exit(1);
}

// Force headless to false for this CLI run
process.env.HEADLESS = 'false';

console.log(`Starting headed scrape for product ID: ${productId}`);
scrapeProduct(parseInt(productId, 10))
  .then(result => {
    console.log("Scrape successful!", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Scrape failed:", err.message);
    process.exit(1);
  });
