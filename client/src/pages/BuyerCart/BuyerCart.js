import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import "../ForSale/ForSale.css"; // Koristimo isti CSS kao ForSale za layout

function BuyerCart() {
    const { id } = useParams();
    const { user } = useAuth();
    const [cartProducts, setCartProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const fetchCartProducts = () => {
        if (!id) return;
        
        setLoading(true);
        fetch(`/products/cart/${id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch cart products');
                }
                return res.json();
            })
            .then(products => {
                setCartProducts(products);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching cart products:', error);
                setError('Failed to load cart products');
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCartProducts();
    }, [id]);

    const handleProductCancel = () => {
        fetchCartProducts();
    };

    if (loading) {
        return (
            <div className="for-sale-page">
                <div className="for-sale-header">
                    <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">
                            Loading Cart
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

    const productsToShow = showAll ? cartProducts : cartProducts.slice(0, 8);
    const hasMoreProducts = cartProducts.length > 8;

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

    // Statistike za cart
    const fixedProducts = cartProducts.filter(p => p.type === 'Fixed');
    const auctionProducts = cartProducts.filter(p => p.type === 'Auction');

    return (
        <div className="for-sale-page">
            <div className="for-sale-header">
                <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
            </div>

            <div className="for-sale-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="page-title">My Cart</h1>
                    <p className="page-subtitle">Manage your pending purchases and bids</p>
                </div>

                {cartProducts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">Your Cart is Empty</h2>
                        <p className="empty-subtitle">
                            You don't have any pending purchases or bids. 
                            <Link to="/buyer/shop" className="add-link"> Browse the shop</Link> to find something interesting.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="products-stats">
                            <div className="stat-item">
                                <span className="stat-number">{cartProducts.length}</span>
                                <span className="stat-label">Total Items</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{fixedProducts.length}</span>
                                <span className="stat-label">Purchases</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{auctionProducts.length}</span>
                                <span className="stat-label">Auction Bids</span>
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
                                        <CartProductCard 
                                            product={product} 
                                            buyerId={parseInt(id)}
                                            onCancel={handleProductCancel}
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

// Posebna komponenta za Cart ProductCard sa Cancel funkcionalnosti
function CartProductCard({ product, buyerId, onCancel }) {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const navigate = useNavigate();

    const handleCancelClick = () => {
        setShowCancelDialog(true);
    };

    const handleConfirmCancel = () => {
        let endpoint;
        
        if (product.type === 'Fixed') {
            // Otkazi Fixed kupovinu
            endpoint = `/products/${product.id}/cancel/${buyerId}`;
        } else if (product.type === 'Auction') {
            // Otkazi Auction bid
            endpoint = `/products/${product.id}/cancel-bid/${buyerId}`;
        }

        fetch(endpoint, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => Promise.reject(err));
            }
            return res.json();
        })
        .then(data => {
            alert(data.msg);
            setShowCancelDialog(false);
            onCancel(); // Osvezi listu
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.msg || 'Failed to cancel');
            setShowCancelDialog(false);
        });
    };

    const onMoreClick = () => {
        navigate(`/products/${product.id}`);
    };

    // Prikazi najvisu ponudu korisnika za aukcije
    const getUserHighestBid = () => {
        if (product.type === 'Auction' && product.offers) {
            const userOffers = product.offers.filter(offer => offer.buyerId === buyerId);
            if (userOffers.length > 0) {
                return Math.max(...userOffers.map(offer => offer.amount));
            }
        }
        return null;
    };

    const userBid = getUserHighestBid();

    return (
        <>
            <div className={`product-card ${product.type.toLowerCase()}`}>
                <div className="card-glow"></div>
                
                <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p>{product.date}</p>
                    <div className="product-status processing">
                        {product.type === 'Fixed' ? 'PURCHASE PENDING' : 'BID PLACED'}
                    </div>
                    <p>{product.price} RSD</p>
                    {userBid && (
                        <p style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px'}}>
                            Your bid: {userBid.toLocaleString()} RSD
                        </p>
                    )}
                </div>
                
                <div className="product-more">
                    <button className="more-btn" onClick={onMoreClick}>
                        INFO
                    </button>
                </div>

                <div className="product-overlay">
                    <button 
                        className="cancel-btn-card"
                        onClick={handleCancelClick}
                    >
                        CANCEL {product.type === 'Fixed' ? 'PURCHASE' : 'BID'}
                    </button>
                </div>
            </div>

            {/* Cancel Dialog */}
            {showCancelDialog && (
                <div className="dialog-overlay">
                    <div className="dialog-container">
                        <div className="dialog-header">
                            <h3>Cancel {product.type === 'Fixed' ? 'Purchase' : 'Bid'}</h3>
                            <button className="close-btn" onClick={() => setShowCancelDialog(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="dialog-content">
                            <div className="product-summary">
                                <h4>"{product.name}"</h4>
                                <p>Price: {product.price.toLocaleString()} RSD</p>
                                {userBid && <p>Your highest bid: {userBid.toLocaleString()} RSD</p>}
                            </div>

                            <div className="decision-content">
                                <p>
                                    Are you sure you want to cancel this {product.type === 'Fixed' ? 'purchase' : 'bid'}?
                                </p>
                                {product.type === 'Fixed' && (
                                    <p style={{fontSize: '14px', color: '#7B637B'}}>
                                        This will remove the product from your cart and the seller will be notified.
                                    </p>
                                )}
                                {product.type === 'Auction' && (
                                    <p style={{fontSize: '14px', color: '#7B637B'}}>
                                        This will remove all your bids from this auction.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="dialog-actions">
                            <button className="cancel-btn" onClick={() => setShowCancelDialog(false)}>
                                Keep Item
                            </button>
                            <button className="confirm-reject-btn" onClick={handleConfirmCancel}>
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default BuyerCart;