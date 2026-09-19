import { useState, useEffect, useRef } from 'react';
import { Search, Plus, RefreshCw, X, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState([]);
  const [productLogs, setProductLogs] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  
  const [trackingId, setTrackingId] = useState(null);
  
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchTrackedProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      setIsSearching(true);
      fetch(`${API_BASE}/products/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.items) setSearchResults(data.items);
        })
        .finally(() => setIsSearching(false));
    }, 500);
  }, [searchQuery]);

  const fetchTrackedProducts = () => {
    fetch(`${API_BASE}/tracked-products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTrackedProducts(data);
        } else {
          setTrackedProducts([]);
          console.error("API Error:", data);
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setTrackedProducts([]);
      });
  };

  const trackProduct = (product) => {
    setTrackingId(product.id);
    fetch(`${API_BASE}/tracked-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    })
      .then(() => {
        setSearchQuery('');
        setSearchResults([]);
        fetchTrackedProducts();
      })
      .finally(() => setTrackingId(null));
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    
    // Fetch history
    fetch(`${API_BASE}/tracked-products/${product.id}/history`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductHistory(data);
        else setProductHistory([]);
      })
      .catch(() => setProductHistory([]));
      
    // Fetch logs
    fetch(`${API_BASE}/tracked-products/${product.id}/logs`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProductLogs(data);
        else setProductLogs([]);
      })
      .catch(() => setProductLogs([]));
  };

  const manualScrape = (productId) => {
    setIsScraping(true);
    fetch(`${API_BASE}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId })
    })
      .then(res => res.json())
      .then(() => {
        if (selectedProduct && selectedProduct.id === productId) {
          openProductDetails(selectedProduct); // refresh details
        }
        fetchTrackedProducts(); // refresh grid
      })
      .finally(() => setIsScraping(false));
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="app-container">
      <header className="glass-panel">
        <div className="logo">
          <Activity className="logo-icon" size={28} />
          INE Price Tracker
        </div>
        <button className="btn-primary" onClick={fetchTrackedProducts}>
          <RefreshCw size={18} /> Refresh All
        </button>
      </header>

      <main>
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search catalog to track products (e.g., 'toaster', 'laptop')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {searchResults.length > 0 && (
            <div className="search-results glass-panel">
              {searchResults.map(item => (
                <div key={item.id} className="search-result-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.brand} • {item.category}</div>
                  </div>
                  <button 
                    className="btn-primary" 
                    disabled={item.tracked || trackingId === item.id}
                    onClick={() => trackProduct(item)}
                  >
                    {item.tracked ? 'Tracked' : trackingId === item.id ? 'Scraping...' : <><Plus size={16} /> Track</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="products-grid">
          {trackedProducts.map(product => (
            <div key={product.id} className="product-card glass-panel" onClick={() => openProductDetails(product)}>
              <div className="product-meta">
                <span>{product.brand}</span>
                <span className={`badge ${product.in_stock ? 'in-stock' : 'out-stock'}`}>
                  {product.latest_price === null ? 'Pending' : (product.in_stock ? 'In Stock' : 'Out of Stock')}
                </span>
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{product.name}</h3>
              <div className="product-price">
                {formatCurrency(product.latest_price)}
              </div>
              <div className="product-meta" style={{ marginTop: 'auto' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={14} /> 
                  {product.last_scraped_at ? format(new Date(product.last_scraped_at), 'MMM d, h:mm a') : 'Never'}
                </span>
              </div>
            </div>
          ))}
          {trackedProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              No products tracked yet. Search above to add products!
            </div>
          )}
        </div>
      </main>

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>
              <X size={24} />
            </button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedProduct.name}</h2>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedProduct.brand} • SKU {selectedProduct.slug}</div>
              </div>
              <button className="btn-primary" onClick={() => manualScrape(selectedProduct.id)} disabled={isScraping}>
                <RefreshCw size={18} className={isScraping ? 'spin' : ''} />
                {isScraping ? 'Scraping...' : 'Force Scrape'}
              </button>
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Price History</h3>
            <div className="chart-container">
              {productHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="created_at" 
                      tickFormatter={(val) => format(new Date(val), 'MMM d')}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tickFormatter={(val) => `₹${val}`}
                      stroke="rgba(255,255,255,0.5)"
                    />
                    <RechartsTooltip 
                      contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelFormatter={(label) => format(new Date(label), 'PPpp')}
                      formatter={(value) => [formatCurrency(value), 'Price']}
                    />
                    <Line type="stepAfter" dataKey="price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                  No history data available yet.
                </div>
              )}
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginTop: '2rem' }}>Scrape Logs</h3>
            {productLogs.length > 0 ? (
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {productLogs.map(log => (
                    <tr key={log.id}>
                      <td>{format(new Date(log.created_at), 'MMM d, h:mm:ss a')}</td>
                      <td>
                        <span className={`badge ${log.success ? 'in-stock' : 'out-stock'}`}>
                          {log.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ color: log.success ? 'inherit' : 'var(--danger-color)' }}>
                        {log.error_message || 'Price extracted successfully'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>No logs available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
