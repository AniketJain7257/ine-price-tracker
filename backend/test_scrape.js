const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('https://demo.inelabteamdev.com/product/181');
    
    // Hide cookie banner permanently so it never blocks the mouse
    await page.addStyleTag({ content: '.cookie-overlay, .cookie-banner { display: none !important; pointer-events: none !important; }' });
    
    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
        attempts++;
        const revealBtn = page.locator('button:has-text("Reveal price"), button:has-text("Try again")');
        await revealBtn.waitFor({ state: 'visible' });
        
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
            console.log(`Attempt ${attempts} failed. Retrying...`);
        }
    }
    
    if (success) {
        console.log('SUCCESS');
    } else {
        console.log('FAILED ALL ATTEMPTS');
    }
    
    await browser.close();
})();
