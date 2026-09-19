const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');

const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', productRoutes);

// Basic health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Run bulk scrape every hour
cron.schedule('0 * * * *', () => {
    console.log('Running scheduled hourly scrape...');
    // We can simulate a call to the cronScrape controller or call it directly.
    // Calling via fetch is easiest:
    fetch(`http://localhost:${PORT}/api/cron/scrape`, { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('Cron scrape result:', data))
        .catch(err => console.error('Cron scrape failed:', err.message));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
