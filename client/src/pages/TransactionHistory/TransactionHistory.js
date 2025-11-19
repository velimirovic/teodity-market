import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { AnimatePresence, motion } from "framer-motion";
import "./TransactionHistory.css";

function TransactionHistory() {
    const { user } = useAuth();
    const [historyProducts, setHistoryProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [showAll, setShowAll] = useState(false);

    const fetchHistoryProducts = () => {
        if (!user?.id) return;
        
        setLoading(true);
        fetch(`/products/seller-history/${user.id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch transaction history');
                }
                return res.json();
            })
            .then(products => {
                const sortedProducts = products.sort((a, b) => {
                    return new Date(b.date) - new Date(a.date);
                });
                setHistoryProducts(sortedProducts);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching transaction history:', error);
                setError('Failed to load transaction history');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHistoryProducts();
    }, [user?.id]);

    const getFilteredProducts = () => {
        let filtered = historyProducts;
        
        if (filter === 'sold') {
            filtered = historyProducts.filter(product => product.status === 'Sold');
        } else if (filter === 'rejected') {
            filtered = historyProducts.filter(product => product.status === 'Rejected');
        }
        
        return showAll ? filtered : filtered.slice(0, 8);
    };

    const filteredProducts = getFilteredProducts();
    const allFilteredProducts = historyProducts.filter(product => {
        if (filter === 'sold') return product.status === 'Sold';
        if (filter === 'rejected') return product.status === 'Rejected';
        return true;
    });
    const hasMoreProducts = allFilteredProducts.length > 8;

    const getDelay = (idx) => idx * 0.05;

    const onMoreClick = () => {
        if (showAll) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setShowAll((prev) => !prev);
    };

    const calculateTotalRevenue = () => {
        return historyProducts
            .filter(product => product.status === 'Sold')
            .reduce((total, product) => {
                if (product.type === 'Auction' && product.finalPrice) {
                    return total + product.finalPrice;
                }
                return total + product.price;
            }, 0);
    };

    if (loading) {
        return (
            <div className="transaction-history-page">
                <div className="transaction-history-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">
                            Loading Transaction History
                            <span className="loading-dots"></span>
                        </h2>
                        <div className="dot-container">
                            <div className="dot dot-1"></div>
                            <div className="dot dot-2"></div>
                            <div className="dot dot-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="transaction-history-page">
                <div className="transaction-history-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="error-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="transaction-history-page">
            <div className="transaction-history-header">
                <Link to="/" className="back-link-main">← Back to Home</Link>
            </div>

            <div className="transaction-history-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3V21H21V3H3ZM19 19H5V5H19V19ZM17 7H7V9H17V7ZM17 11H7V13H17V11ZM17 15H7V17H17V15Z" fill="white"/>
                        </svg>
                    </div>
                    <h1 className="page-title">Transaction History</h1>
                    <p className="page-subtitle">Complete overview of your sales and transactions</p>
                </div>

                {historyProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3V21H21V3H3ZM19 19H5V5H19V19Z" fill="white"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">No Transaction History</h2>
                        <p className="empty-subtitle">
                            You haven't completed any transactions yet. 
                            Sold and rejected products will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="revenue-stats">
                            <div className="stat-item">
                                <span className="stat-number">
                                    {historyProducts.filter(p => p.status === 'Sold').length}
                                </span>
                                <span className="stat-label">Products Sold</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {historyProducts.filter(p => p.status === 'Rejected').length}
                                </span>
                                <span className="stat-label">Rejected Sales</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{historyProducts.length}</span>
                                <span className="stat-label">Total Transactions</span>
                            </div>
                        </div>

                        <div className="filter-controls">
                            <button 
                                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                                onClick={() => {setFilter('all'); setShowAll(false);}}
                            >
                                All ({historyProducts.length})
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'sold' ? 'active' : ''}`}
                                onClick={() => {setFilter('sold'); setShowAll(false);}}
                            >
                                Sold ({historyProducts.filter(p => p.status === 'Sold').length})
                            </button>
                            <button 
                                className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                                onClick={() => {setFilter('rejected'); setShowAll(false);}}
                            >
                                Rejected ({historyProducts.filter(p => p.status === 'Rejected').length})
                            </button>
                        </div>

                        <div className="products-grid">
                            <AnimatePresence mode="wait">
                                {filteredProducts.map((product, idx) => (
                                    <motion.div
                                        key={`${product.id}-${filter}`}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 40 }}
                                        transition={{
                                            delay: getDelay(idx),
                                            duration: 0.4
                                        }}
                                        layout
                                    >
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {hasMoreProducts && (
                            <div className="more-section">
                                <button className="show-more-btn" onClick={onMoreClick}>
                                    {showAll ? "Show Less" : "Show More"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
            <div className="decorative-circle circle-3"></div>
        </div>
    );
}

export default TransactionHistory;