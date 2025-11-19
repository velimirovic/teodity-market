import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { AnimatePresence, motion } from "framer-motion";
import "./ForSale.css";

function ForSale() {
    const { user } = useAuth();
    const [forSaleProducts, setForSaleProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const fetchForSaleProducts = () => {
        if (!user?.id) return;
        
        setLoading(true);
        fetch(`/products/for-seller/${user.id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch products for sale');
                }
                return res.json();
            })
            .then(products => {
                setForSaleProducts(products);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching for sale products:', error);
                setError('Failed to load your products for sale');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchForSaleProducts();
    }, [user?.id]);

    const handleProductUpdate = () => {
        fetchForSaleProducts();
    };

    if (loading) {
        return (
            <div className="for-sale-page">
                <div className="for-sale-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">
                            Loading Products
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
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="error-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    const productsToShow = showAll ? forSaleProducts : forSaleProducts.slice(0, 8);
    const hasMoreProducts = forSaleProducts.length > 8;

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

    return (
        <div className="for-sale-page">
            <div className="for-sale-header">
                <Link to="/" className="back-link-main">← Back to Home</Link>
            </div>

            <div className="for-sale-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="page-title">Products For Sale</h1>
                    <p className="page-subtitle">Manage your active listings</p>
                </div>

                {forSaleProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">No Products for Sale</h2>
                        <p className="empty-subtitle">
                            You don't have any active listings. 
                            <Link to="/add" className="add-link"> Add a new product</Link> to start selling.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="products-stats">
                            <div className="stat-item">
                                <span className="stat-number">{forSaleProducts.length}</span>
                                <span className="stat-label">Total Active</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {forSaleProducts.filter(p => p.type === 'Fixed').length}
                                </span>
                                <span className="stat-label">Fixed Price</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {forSaleProducts.filter(p => p.type === 'Auction').length}
                                </span>
                                <span className="stat-label">Auctions</span>
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
                                        <ProductCard 
                                            product={product} 
                                            onDelete={handleProductUpdate}
                                            onPurchase={handleProductUpdate}
                                        />
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

export default ForSale;