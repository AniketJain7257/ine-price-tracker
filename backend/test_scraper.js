const { scrapeProduct } = require('./src/scraper/scraper');

(async () => {
    console.log("Starting scraper test...");
    try {
        const result = await scrapeProduct(471);
        console.log("Scrape result:", result);
    } catch (e) {
        console.error(e);
    }
})();
