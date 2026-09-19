const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://demo.inelabteamdev.com/product/471');
  
  try {
    await page.waitForSelector('.price-block');
    
    // Accept cookies to get the overlay out of the way
    const acceptBtn = page.locator('button:has-text("Accept")');
    if (await acceptBtn.isVisible()) {
        await acceptBtn.click();
        await page.waitForSelector('.cookie-overlay', { state: 'hidden', timeout: 5000 });
    }
    
    console.log("Starting human-like hover...");
    
    // Trigger mouse enter
    await page.evaluate(() => {
        const el = document.querySelector('.price-block');
        const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
        el[key].onMouseEnter();
    });
    
    // Dispatch mouse moves with 50ms delay
    for (let i = 0; i < 60; i++) {
        await page.evaluate((i) => {
            const el = document.querySelector('.price-block');
            const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
            // Fake mouse event
            el[key].onMouseMove({ clientX: 100 + i, clientY: 100 + i });
        }, i);
        await page.waitForTimeout(50);
    }
    
    console.log("Wait additional time just in case minWait is larger");
    await page.waitForTimeout(1000);
    
    // Dispatch some more just to trigger a re-render if needed
    for (let i = 0; i < 5; i++) {
        await page.evaluate((i) => {
            const el = document.querySelector('.price-block');
            const key = Object.keys(el).find(k => k.startsWith('__reactProps'));
            el[key].onMouseMove({ clientX: 100 + i, clientY: 100 + i });
        }, i);
        await page.waitForTimeout(50);
    }
    
    console.log("Checking if Reveal button is enabled...");
    
    const revealBtn = page.locator('button:has-text("Reveal price")');
    if (await revealBtn.isEnabled()) {
        console.log("Button IS ENABLED! Clicking...");
        await revealBtn.click();
        await page.waitForTimeout(3000);
        
        const content = await page.content();
        require('fs').writeFileSync('final_dom_success.html', content);
        console.log("Done.");
    } else {
        console.log("Button STILL DISABLED.");
    }
    
  } catch (err) {
    console.error("Error:", err);
  }
  
  await browser.close();
})();
