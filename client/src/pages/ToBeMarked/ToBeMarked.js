import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { AnimatePresence, motion } from "framer-motion";
import "./ToBeMarked.css";

function ToBeMarked() {
    const { user } = useAuth();
    const [pendingProducts, setPendingProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPendingProducts = () => {
        if (!user?.id) return;
        
        setLoading(true);
        fetch(`/products/to-be-marked/${user.id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch pending products');
                }
                return res.json();
            })
            .then(products => {
                setPendingProducts(products);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching pending products:', error);
                setError('Failed to load pending products');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPendingProducts();
    }, [user?.id]);

    if (loading) {
        return (
            <div className="to-be-marked-page">
                <div className="to-be-marked-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">
                            Loading Pending Requests
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
            <div className="to-be-marked-page">
                <div className="to-be-marked-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
                <div className="error-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="to-be-marked-page">
            <div className="to-be-marked-header">
                <Link to="/" className="back-link-main">← Back to Home</Link>
            </div>

            <div className="to-be-marked-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="page-title">To Be Marked</h1>
                    <p className="page-subtitle">Review and respond to purchase requests</p>
                </div>

                {pendingProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">No Pending Requests</h2>
                        <p className="empty-subtitle">
                            You have no purchase requests awaiting your response. 
                            New requests will appear here for your review.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="products-stats">
                            <div className="stat-item">
                                <span className="stat-number">{pendingProducts.length}</span>
                                <span className="stat-label">Pending Requests</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {pendingProducts.filter(p => p.type === 'Fixed').length}
                                </span>
                                <span className="stat-label">Fixed Price</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {pendingProducts.filter(p => p.type === 'Auction').length}
                                </span>
                                <span className="stat-label">Auction Winners</span>
                            </div>
                        </div>

                        <div className="products-grid">
                            <AnimatePresence mode="wait">
                                {pendingProducts.map((product, idx) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 40 }}
                                        transition={{
                                            delay: idx * 0.1,
                                            duration: 0.4
                                        }}
                                        layout
                                    >
                                        <ProductCard 
                                            product={product} 
                                            onPurchase={fetchPendingProducts}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
            <div className="decorative-circle circle-3"></div>
        </div>
    );
}

export default ToBeMarked;