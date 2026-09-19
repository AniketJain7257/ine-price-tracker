# INE Price Tracker - Design Note

## The Challenge
The core requirement of this assignment was to reliably scrape the INE Mock Storefront. The storefront aggressively employs several anti-bot techniques:
1. **Dynamic CSS Class Names:** Core layout elements use obfuscated, rotating class names (e.g., `v6tan7h`, `pv-m4`).
2. **Cookie Banners:** An obtrusive cookie consent banner blocks pointer events.
3. **Synthetic Mouse Movement Detection (Challenge Failed):** The store tracks mouse coordinate geometry. Simply triggering a React `onMouseEnter` or dispatching a generic synthetic `mousemove` event at hardcoded coordinates (or with too little path variance) results in a silent `<p class="price-substatus">challenge_failed</p>` inside the DOM, and a "Try again" button appears instead of the price.
4. **Double-click Traps:** Even with proper mouse behavior, the site occasionally rejects the first click to weed out simple scripts, requiring a manual retry.
5. **Asynchronous Hydration & Loading Delays:** The price block often takes several seconds to appear after the page has fully loaded.

## How I Made Scraping Reliable

### 1. Robust Selectors
Instead of relying on volatile CSS classes like `.pv-m4`, I used semantic HTML elements and semantic aria-labels (e.g., `.price-success output`, `button[aria-label="Reveal price"]`). This insulates the scraper against frequent frontend styling changes.

### 2. Defeating the Cookie Banner via CSS Injection
Waiting for the cookie banner to appear and attempting to click "Accept" is brittle, as the banner's load time varies wildly and sometimes doesn't appear at all. Instead of clicking it, the scraper injects a global `<style>` tag immediately upon page load:
```css
.cookie-overlay, .cookie-banner { display: none !important; pointer-events: none !important; }
```
This guarantees the overlay will never block the Playwright mouse interactions, regardless of when or if it mounts.

### 3. Realistic Curved Mouse Pathing (Native Steps)
To beat the mouse tracking heuristic, I couldn't just teleport the mouse to the center of the button. The scraper calculates the bounding box of the `.price-block` dynamically for each product (as layouts vary by product type, e.g., footwear vs. appliances). It then uses Playwright's native `page.mouse.move()` API with the `{ steps: 50 }` parameter. This leverages the browser's native C++ input dispatch to generate a perfectly smooth, realistic mouse trajectory with consistent timings, cleanly bypassing the challenge that my earlier manual `Math.sin` loops triggered on heavily loaded servers.

### 4. Resilient Retry Loops (Handling "Try again")
To handle the "double-click trap" where the store randomly fails the first challenge, I wrapped the click execution in a smart `while` loop. If the scraper detects a `button:has-text("Try again")`, it immediately re-initiates the curved mouse approach and clicks the retry button. This allows the scraper to gracefully recover without throwing a fatal error, accurately extracting the price on the second attempt.

### 5. Correct Handling of Free-tier Scheduling
Because free-tier servers (like Render) sleep when idle, `node-cron` internal scheduling is insufficient. The backend exposes an unauthenticated `/api/cron/scrape` endpoint. I configured an external service (`cron-job.org`) to ping this endpoint every 2 hours. This external ping wakes the Render instance up if it's sleeping and successfully triggers the scraping logic.

## Trade-offs
- **Playwright vs Lightweight Fetching:** I opted to use Playwright (headless browser) rather than lightweight HTTP fetching (`axios`/`cheerio`). The mock store heavily relies on React hydration, synthetic event listeners for anti-bot, and dynamic price injection based on client-side JS state. Emulating all of this via pure HTTP requests would require reverse-engineering their heavily obfuscated webpack bundles. Playwright is much heavier on server resources, but it guarantees absolute correctness and reliability against this specific JS-heavy anti-bot system.
- **Price Extraction:** Prices in the DOM contain zero-width spaces (`&#8203;`) and varying currency symbols. I used `replace(/\D/g, '')` to strip all non-digits to ensure clean database inserts, though this assumes all prices are whole numbers (which is true for this store).

## What the AI Tools Got Wrong Initially
Initially, the AI attempted to trigger React synthetic events directly by digging into the DOM node's `__reactProps` and calling `onMouseMove({ clientX: 100, clientY: 100 })`. 
- **The Failure:** This failed miserably because the mock store validates if the coordinates actually intersect with the button's true bounding box. Since layouts vary across products, `100,100` was often hovering over empty space, triggering the `challenge_failed` trap.
- **The Correction:** I guided the implementation away from synthetic React exploits and toward Playwright's native `page.mouse.move()` API, utilizing the element's dynamic bounding box and injecting mathematical variance to simulate a genuine human cursor.
