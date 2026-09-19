const supabase = require('../db/supabase');
const { scrapeProduct } = require('../scraper/scraper');


// Utility to run a scrape and save to DB
async function runScrape(productId) {
    let success = false;
    let price = null;
    let inStock = null;
    let errorMsg = null;

    try {
        const result = await scrapeProduct(productId);
        price = result.price;
        inStock = result.inStock;
        success = true;
    } catch (e) {
        success = false;
        errorMsg = e.message;
    }

    // Insert log
    await supabase.from('scrape_logs').insert({
        product_id: productId,
        success,
        error_message: errorMsg
    });

    if (success && price !== null) {
        // Update product latest price/stock
        await supabase.from('products').update({
            latest_price: price,
            in_stock: inStock,
            last_scraped_at: new Date().toISOString()
        }).eq('id', productId);

        // Insert into price history
        await supabase.from('price_history').insert({
            product_id: productId,
            price: price,
            in_stock: inStock
        });
    } else {
        // Update product last scrape time anyway
        await supabase.from('products').update({
            last_scraped_at: new Date().toISOString()
        }).eq('id', productId);
    }
    
    return { success, price, inStock, error: errorMsg };
}

exports.searchProducts = async (req, res) => {
    try {
        const q = req.query.q || '';
        const response = await fetch(`https://demo.inelabteamdev.com/api/catalog?q=${encodeURIComponent(q)}`);
        if (!response.ok) throw new Error('Catalog API error');
        const data = await response.json();
        
        // Check which ones are tracked
        const { data: trackedProducts } = await supabase.from('products').select('id');
        const trackedIds = new Set(trackedProducts?.map(p => p.id) || []);
        
        const items = data.items.map(item => ({
            ...item,
            tracked: trackedIds.has(item.id)
        }));
        
        res.json({ ...data, items });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getTrackedProducts = async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.trackProduct = async (req, res) => {
    try {
        const { id, name, slug, brand, category, image_url } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });

        const { data: existing } = await supabase.from('products').select('id').eq('id', id).single();
        if (existing) {
            return res.status(400).json({ error: 'Product already tracked' });
        }

        const { error } = await supabase.from('products').insert({
            id, name, slug, brand, category, image_url
        });
        if (error) throw error;

        // Start async scrape, wait for it so the initial data is ready for the frontend
        await runScrape(id).catch(console.error);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getTrackedProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getProductHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('price_history').select('*').eq('product_id', id).order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.getProductLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('scrape_logs').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(20);
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.manualScrape = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing product ID' });
        
        // Wait for it this time
        const result = await runScrape(id);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.cronScrape = async (req, res) => {
    try {
        const { data: products } = await supabase.from('products').select('id');
        if (!products) return res.json({ success: true, count: 0 });
        
        // Start all in background
        products.forEach(p => runScrape(p.id).catch(console.error));
        
        res.json({ success: true, count: products.length });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
