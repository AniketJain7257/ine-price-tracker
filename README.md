# INE Price Tracker - Software Engineer Intern Assignment

A full-stack web application designed to track products on the INE Mock Storefront. It allows users to search for products, select items to track, and schedule robust automated scraping of their prices and stock status over time.

## 🚀 Live Demo & Deployment
- **Frontend (Vercel):https://ine-price-tracker-nine.vercel.app/
- **Backend (Render): https://ine-price-tracker-nit4.onrender.com

## 🛠️ Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Scraping Engine:** Playwright (Headless Chromium)
- **Scheduling:** cron-job.org

---

## ⚙️ Setup Instructions

### 1. Database Setup (Supabase)
1. Create a new Supabase project.
2. Go to the SQL Editor and execute the schema provided in `schema.sql` (located in the root directory) to create the necessary tables (`products`, `price_history`, `scrape_logs`).
3. Note your Supabase URL and Anon Key.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Install the Playwright Chromium browser required for scraping:
   ```bash
   npx playwright install chromium
   ```
4. Create a `.env` file in the `backend` folder containing your environment variables (see below).
5. Start the backend server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
1. Open a terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder containing your environment variables (see below).
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables Required

### Backend (`backend/.env`)
Create a `.env` file in the `backend` directory with the following keys:
```env
# The port the Express server will run on (default is 5000)
PORT=5000

# Your Supabase connection details
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Set to 'false' to run Playwright in a visible window (headed mode)
HEADLESS=true
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend` directory with the following keys:
```env
# The URL where your backend is hosted (use localhost for local development)
VITE_API_URL=http://localhost:5000/api
```

---

## ⏱️ Scraping Schedule & Cron Configuration

Because free-tier hosting providers (like Render) spin down and sleep after a period of inactivity, traditional internal schedulers (like `node-cron`) will fail to run unattended. 

To satisfy the assignment's requirement of scraping on a fixed **2-hour schedule** across unattended runs, this app exposes an unauthenticated endpoint:
`POST /api/cron/scrape`

**Configuration Instructions:**
1. Create a free account at [cron-job.org](https://cron-job.org/).
2. Create a new cron job targeting your deployed backend URL.
   - **URL:** `https://your-render-url.onrender.com/api/cron/scrape`
   - **HTTP Method:** `POST`
   - **Schedule:** Every 2 hours (e.g., `0 */2 * * *`)
3. **How it works:** Every 2 hours, `cron-job.org` pings this endpoint. This external ping wakes up the sleeping Render instance (if necessary) and triggers the Playwright scraper to process all tracked products concurrently, updating the database with fresh prices and stock statuses.

---

## 👁️ Observable (Headed) Run
The assignment requires providing a way to run the scraper in headed mode so its behavior (and anti-bot evasion) can be watched.

1. Navigate to the backend folder (`cd backend`).
2. Run the dedicated headed script:
   ```bash
   npm run scrape:headed
   ```
3. The script will prompt you to enter a Product ID (e.g., `571` or `634`).
4. A Chromium browser window will launch. You can observe the scraper navigating to the mock store, hiding the cookie banner, tracing a realistic curved mouse path (`steps: 50`) into the "Reveal price" button, and gracefully handling the "Try again" anti-bot retries.
