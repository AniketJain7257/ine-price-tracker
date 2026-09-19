const { chromium } = require('playwright');

/**
 * Scrapes the price and stock of a product from the mock store.
 * @param {number} productId 
 * @returns {Promise<{ price: number, stock: boolean }>}
 */
async function scrapeProduct(productId, headless = process.env.HEADLESS !== 'false') {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(`https://demo.inelabteamdev.com/product/${productId}`, { waitUntil: 'domcontentloaded' });
    
    // Hide cookie banner permanently so it never blocks the mouse
    await page.addStyleTag({ content: '.cookie-overlay, .cookie-banner { display: none !important; pointer-events: none !important; }' });
    
    let success = false;
    let attempts = 0;
    while (!success && attempts < 5) {
        attempts++;
        const revealBtn = page.locator('button:has-text("Reveal price"), button:has-text("Try again")');
        await revealBtn.waitFor({ state: 'visible' });
        
        await revealBtn.scrollIntoViewIfNeeded();
        
        const box = await revealBtn.boundingBox();
        if (box) {
            // Start at top left of page
            await page.mouse.move(0, 0);
            
            // Move into the button using Playwright's built-in interpolation
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 50 });
            
            // Wait minWait
            await page.waitForTimeout(1500);
            
            // Final small jitter inside the button
            await page.mouse.move(box.x + box.width / 2 + 5, box.y + box.height / 2 + 5, { steps: 5 });
            await page.waitForTimeout(50);
        }
        
        await revealBtn.click({ force: true });
        
        try {
            await page.waitForSelector('.price-success', { timeout: 6000 });
            success = true;
        } catch (e) {
            // If it failed, it should show Try again, so it will loop
            console.log(`Attempt ${attempts} failed for product ${productId}. Retrying...`);
        }
    }
    
    if (!success) {
        throw new Error('Reveal button never became enabled or challenge failed multiple times.');
    }
    
    // Extract real price.
        const priceText = await page.evaluate(() => {
            const pvElement = document.querySelector('.price-success output');
            return pvElement ? pvElement.textContent : null;
        });
        
        // Extract stock
        const stockText = await page.evaluate(() => {
            const stockBadge = document.querySelector('.stock-badge');
            return stockBadge ? stockBadge.textContent : null;
        });
        
        let price = null;
        if (priceText) {
            // Clean up: remove non-digit characters (including commas, ₹, zero-width spaces)
            const cleanText = priceText.replace(/\D/g, '');
            if (cleanText) {
                price = parseInt(cleanText, 10);
            }
        }
        
        let inStock = true;
        if (stockText && stockText.toLowerCase().includes('out of stock')) {
            inStock = false;
        }
        
        return { price, inStock };
  } catch (err) {
    console.error(`Scraper error for product ${productId}:`, err);
    throw err;
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeProduct
};
