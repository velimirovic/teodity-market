import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import "../ForSale/ForSale.css"; // Koristimo isti CSS kao ForSale za layout

function PurchaseHistory() {
    const { id } = useParams();
    const { user } = useAuth();
    const [historyProducts, setHistoryProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const fetchHistoryProducts = () => {
        if (!id) return;
        
        setLoading(true);
        fetch(`/products/purchase-history/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch purchase history');
                }
                return res.json();
            })
            .then(products => {
                setHistoryProducts(products);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching purchase history:', error);
                setError('Failed to load purchase history');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHistoryProducts();
    }, [id]);

    if (loading) {
        return (
            <div className="for-sale-page">
                <div className="for-sale-header">
                    <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">
                            Loading History
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
            <div className="for-sale-page">
                <div className="for-sale-header">
                    <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
                </div>
                <div className="error-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    const productsToShow = showAll ? historyProducts : historyProducts.slice(0, 8);
    const hasMoreProducts = historyProducts.length > 8;

    const getDelay = (idx, type) => {
        if (type === "exit" && showAll) {
            return (productsToShow.length - idx - 1) * 0.05;
        }
        return idx * 0.05;
    };

    const onMoreClick = () => {
        if (showAll) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setShowAll((prev) => !prev);
    };

    // Statistike za purchase history
    const soldProducts = historyProducts.filter(p => p.status === 'Sold');
    const rejectedProducts = historyProducts.filter(p => p.status === 'Rejected');

    return (
        <div className="for-sale-page">
            <div className="for-sale-header">
                <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
            </div>

            <div className="for-sale-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="white"/>
                        </svg>
                    </div>
                    <h1 className="page-title">Purchase History</h1>
                    <p className="page-subtitle">Review your completed and rejected purchases</p>
                </div>

                {historyProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="white"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">No Purchase History</h2>
                        <p className="empty-subtitle">
                            You haven't completed any purchases yet. 
                            <Link to="/buyer/shop" className="add-link"> Start shopping</Link> to build your purchase history.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="products-stats">
                            <div className="stat-item">
                                <span className="stat-number">{historyProducts.length}</span>
                                <span className="stat-label">Total Transactions</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{soldProducts.length}</span>
                                <span className="stat-label">Successful</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{rejectedProducts.length}</span>
                                <span className="stat-label">Rejected</span>
                            </div>
                        </div>

                        <div className="products-grid">
                            <AnimatePresence mode="wait">
                                {productsToShow.map((product, idx) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 40 }}
                                        transition={{
                                            delay: getDelay(idx, "exit"),
                                            duration: 0.4
                                        }}
                                        layout
                                    >
                                        <HistoryProductCard product={product} />
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

// Posebna komponenta za History ProductCard
function HistoryProductCard({ product }) {
    const navigate = useNavigate();

    const onMoreClick = () => {
        navigate(`/products/${product.id}`);
    };

    return (
        <div className={`product-card ${product.type.toLowerCase()} ${product.status.toLowerCase()}`}>
            <div className="card-glow"></div>
            
            <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                <p>{product.date}</p>
                
                {/* Status */}
                {product.status === 'Sold' ? (
                    <div className="product-status sold">
                        PURCHASED
                    </div>
                ) : (
                    <div className="product-status rejected">
                        REJECTED
                    </div>
                )}
                
                <p>{product.price} RSD</p>
                
                {/* Final price za aukcije */}
                {product.type === 'Auction' && product.finalPrice && (
                    <p className="final-price">Final: {product.finalPrice.toLocaleString()} RSD</p>
                )}
                
                {/* Rejection reason */}
                {product.status === 'Rejected' && product.rejectionReason && (
                    <div className="rejection-reason-inline">
                        <p className="reason-label">Reason:</p>
                        <p className="reason-text">"{product.rejectionReason}"</p>
                    </div>
                )}
            </div>
            
            <div className="product-more">
                <button className="more-btn" onClick={onMoreClick}>
                    INFO
                </button>
            </div>
        </div>
    );
}

export default PurchaseHistory;