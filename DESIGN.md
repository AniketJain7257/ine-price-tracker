# Design Document

## Architecture Overview
The application follows a standard three-tier architecture:
- **Presentation Layer**: A React SPA built with Vite. It features a premium "glassmorphism" aesthetic with a responsive grid and interactive charts.
- **Application Layer**: A Node.js/Express backend that serves as an API gateway, orchestrates tracking logic, and runs a Headless Chromium browser via Playwright.
- **Data Layer**: Supabase PostgreSQL for persistent storage.

## The Scraper Anti-Bot Challenge
The INE mock store obscures the product price and stock availability behind a stateful "Reveal price" button. Traditional scraping tools fail because:
1. The API `/api/product/:id/price` returns 404 (mock).
2. The button is disabled natively using a React hook.
3. The hook (`Ar` class in the minified JS) tracks mouse movements on the `.price-block` container. It explicitly records `[x, y, timestamp]` points, throttles them, and requires a minimum sequence of movements over a duration (`minWait`). If a scraper simply triggers `click()`, the event does nothing.

### Resolution Strategy
The `scraper.js` module executes a script in the context of the page:
1. Re-locates the React `__reactProps` internal object on the DOM node.
2. Direct-invokes `onMouseEnter()` to start the internal timer.
3. Rapidly loops 60 times, dispatching `onMouseMove()` with varying coordinates and 50ms intervals.
4. Waits for the minimum wait threshold (1000-1500ms).
5. Dispatches a final `onMouseMove` to force React to evaluate the state and re-render.
6. Asserts the `button` is enabled, triggers a trusted native click, and waits for the price DOM element (`.pv-k2`) to appear.
7. Parses the price text, stripping out any zero-width spaces (`&#8203;`) and formatting anomalies.

## Database Schema Design
1. **`products`**: Core product tracking metadata (`latest_price`, `in_stock`, `last_scraped_at`).
2. **`price_history`**: Append-only log of every successful price scrape. Serves as the basis for the frontend historical charting.
3. **`scrape_logs`**: Append-only audit log of scraping successes and errors, used for debugging anti-bot drift.
