import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useState, useEffect } from 'react';
import "./ProductCard.css";

function ProductCard({product, onDelete, onPurchase}) {
    const navigate = useNavigate();
    const { user, isLoggedIn, isBuyer, isSeller, isAdmin } = useAuth();
    const { isOnPage, isOnPageGroup } = useNavigation();
    const [showDialog, setShowDialog] = useState(false);
    const [decision, setDecision] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [seller, setSeller] = useState(null);


    const handleDeleteClick = () => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            fetch(`/products/${product.id}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to delete product');
                }
                return res.json();
            })
            .then(() => {
                alert('Product deleted successfully!');
                onDelete(product.id);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to delete product');
            });
        }
    };

    useEffect(() => {
    if (product && product.seller) {
        fetch(`/users/${product.seller}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => setSeller(data))
            .catch(err => console.error('Error fetching seller:', err));
    }
    }, [product.seller]);
    
    function onMoreClick() {
        navigate(`/products/${product.id}`);
    }

    function onEditClick() {
        navigate(`/products/edit/${product.id}`);
    }

    function onBuyClick() {
        if (product.type === 'Fixed') {
            if (window.confirm(`Are you sure you want to purchase "${product.name}" for ${formatPrice(product.price)} RSD?`)) {
                console.log('Starting purchase request for product:', product.id);
                
                fetch(`/products/${product.id}/purchase`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        buyerId: user.id                                             
                    })
                })
                .then(res => {
                    console.log('Response status:', res.status);
                    console.log('Response ok:', res.ok);
                    
                    if (!res.ok) {
                        return res.json().then(err => {
                            console.log('Error response:', err);
                            Promise.reject(err);
                        });
                    }
                    return res.json();
                })
                .then(data => {
                    console.log('Success response:', data);
                    alert(data.msg);
                    if (onPurchase) {
                        onPurchase(product.id);
                    }
                })
                .catch(error => {
                    console.error('Catch block error:', error);
                    console.error('Error type:', typeof error);
                    console.error('Error keys:', Object.keys(error));
                    alert(error.msg || 'Failed to purchase product');
                });
            }
        }
    }

    const onBidClick = () => {
        const bidAmount = prompt(`Enter your bid for "${product.name}". Current highest: ${formatPrice(getHighestBid())} RSD`);
        
        if (bidAmount === null) return; 
        
        const bid = parseFloat(bidAmount);
        if (isNaN(bid) || bid <= getHighestBid()) {
            alert('Please enter a valid bid higher than the current highest bid');
            return;
        }
        
        fetch(`/products/${product.id}/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                buyerId: user.id,
                bidAmount: bid
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => Promise.reject(err));
            }
            return res.json();
        })
        .then(data => {
            alert(data.msg);
            if (onPurchase) {
                onPurchase(product.id);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.msg || 'Failed to place bid');
        });
    };

    const handleActionClick = () => {
        if (product.type === 'Fixed') {
            onBuyClick();
        } else if (product.type === 'Auction') {
            onBidClick();
        }
    };

    const formatPrice = (price) => {
        return price.toLocaleString('sr-RS');
    };
    
    const getHighestBid = () => {
        if (!product.offers || product.offers.length === 0) {
            return product.price;
        }
        return Math.max(...product.offers.map(offer => offer.amount));
    };

    // Odredjujemo tekst dugmeta na osnovu tipa proizvoda
    const getButtonText = () => {
        if (product.type === 'Fixed') {
            return 'BUY';
        } else {
            return 'OFFER BID';
        }
    };

    // Odredjujemo ikonicu dugmeta na osnovu tipa proizvoda
    const getButtonIcon = () => {
        if (product.type === 'Fixed') {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{zIndex: 2, position: 'relative'}}>
                    <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13M9 19C7.9 19 7 19.9 7 21S7.9 23 9 23 11 22.1 11 21 10.1 19 9 19ZM20 19C18.9 19 18 19.9 18 21S18.9 23 20 23 22 22.1 22 21 21.1 19 20 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        } else {
            return (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{zIndex: 2, position: 'relative'}}>
                    <path d="M12 2L3.09 8.26L12 14L20.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.09 15.74L12 22L20.91 15.74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.09 8.26L12 14.52L20.91 8.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        }
    };

    /*-----------------------------------TO BE MARKED----------------------------------- */

    const handleAnswerClick = () => {
        setShowDialog(true);
        setDecision('');
        setRejectionReason('');
    };

    const handleEndAuction = () => {
        fetch(`/products/${product.id}/end-auction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sellerId: user.id
            })
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(err => Promise.reject(err));
            }
            return res.json();
        })
        .then(data => {
            alert(`Auction ended! Winner: ${data.winner}, Final Price: ${formatPrice(data.finalPrice)} RSD`);
            setShowDialog(false);
            if (onPurchase) {
                onPurchase(product.id);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.msg || 'Failed to end auction');
            setShowDialog(false);
        });
    };

    const handleConfirmDecision = () => {
        if (decision === 'reject' && !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        const endpoint = decision === 'approve' 
            ? `/products/${product.id}/approve/${product.buyer}`
            : `/products/${product.id}/reject/${product.buyer}`;

        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (decision === 'reject') {
            requestOptions.body = JSON.stringify({ reason: rejectionReason });
        }

        fetch(endpoint, requestOptions)
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => Promise.reject(err));
                }
                return res.json();
            })
            .then(data => {
                alert(data.msg);
                setShowDialog(false);
                setDecision('');
                setRejectionReason('');
                if (onPurchase) {
                    onPurchase(product.id);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert(error.msg || `Failed to ${decision} purchase`);
            });
    };

    const closeDialog = () => {
        setShowDialog(false);
        setDecision('');
        setRejectionReason('');
    };

    // Provera tipa proizvoda
    const isAuctionProduct = product.type === 'Auction' && 
                            product.offers && 
                            product.offers.length > 0;

    const isFixedProduct = product.type === 'Fixed' && product.buyer;

    /*-----------------------------------TRANSACTION HISTORY----------------------------------- */

    // Vec uradjena logika

    /*-----------------------------------FOR SALE----------------------------------- */

    const canEndAuction = product.type === 'Auction' && 
                          product.status === 'Processing' && 
                          product.offers && 
                          product.offers.length > 0;
    
    //Za dobijanje username-a buyera -  BuyerUsername

    const BuyerUsername = ({ buyerId }) => {
        const [buyerUsername, setBuyerUsername] = useState('');

        useEffect(() => {
            const fetchBuyerUsername = () => {
                fetch(`/users/${buyerId}`)
                    .then(res => {
                        if (!res.ok) {
                            return res.json().then(err => Promise.reject(err));
                        }
                        return res.json();
                    })
                    .then(buyer => {
                        setBuyerUsername(buyer.username);
                    })
                    .catch(error => {
                        console.error('Error fetching buyer:', error);
                        setBuyerUsername('Unknown User');
                    });
            };

            if (buyerId) {
                fetchBuyerUsername();
            }
        }, [buyerId]);

        if (!buyerUsername) {
            return <span>Loading...</span>;
        }

        return <strong>{buyerUsername}</strong>;
    };

    // Komponenta za prikaz highest bid-a
    const HighestBidDisplay = () => {
        if (product.type !== 'Auction' || !product.offers || product.offers.length === 0) {
            return null;
        }
        
        const highestBid = Math.max(...product.offers.map(offer => offer.amount));
        return (
            <p className="highest-bid">Highest bid: {highestBid.toLocaleString()} RSD</p>
        );
    };

    if(isOnPageGroup('/seller')) {
        //TO BE MARKED
        if(isOnPage('/seller/pending')) {
                return (
            <>
                <div className={`product-card ${product.type.toLowerCase()}`}>
                    <div className="card-glow"></div>
                    
                    <div className="product-info">
                        <h3>{product.name}</h3>
                        <p>{product.category}</p>
                        <p>{product.date}</p>
                        {product.status !== 'Started' && (
                            <div className={`product-status ${product.status.toLowerCase().replace(' ', '-')}`}>
                                {product.status}
                            </div>
                        )}
                        <p>{formatPrice(product.price)} RSD</p>
                        <HighestBidDisplay />
                    </div>
                    
                    <div className="product-more">
                        <button className="more-btn" onClick={onMoreClick}>
                            INFO
                        </button>
                    </div>

                    <div className="product-overlay">
                        {isAuctionProduct ? (
                            <button 
                                className="end-auction-btn-simple"
                                onClick={handleAnswerClick}
                            >
                                END AUCTION
                            </button>
                        ) : isFixedProduct && (
                            <button 
                                className="answer-btn-simple"
                                onClick={handleAnswerClick}
                            >
                                ANSWER
                            </button>
                        )}
                    </div>
                </div>

                {/* Dialog za End Auction */}
                {showDialog && (
                    <div className="dialog-overlay">
                        <div className="dialog-container">
                            <div className="dialog-header">
                                <h3>
                                    {isAuctionProduct ? 'End Auction' : 
                                    !decision ? 'Purchase Request' : 
                                    decision === 'approve' ? 'Approve Purchase' : 'Reject Purchase'}
                                </h3>
                                <button className="close-btn" onClick={closeDialog}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="dialog-content">
                                <div className="product-summary">
                                    <h4>"{product.name}"</h4>
                                    <p>Price: {formatPrice(product.price)} RSD</p>
                                </div>

                                {isAuctionProduct ? (
                                    <div className="auction-info">
                                        <p>This auction has <strong>{product.offers.length}</strong> bid(s)</p>
                                        <p><strong>Highest Bid:</strong> {Math.max(...product.offers.map(offer => offer.amount)).toLocaleString()} RSD</p>
                                        <p><strong>Highest Bidder:</strong> <BuyerUsername buyerId={product.offers.reduce((max, offer) => offer.amount > max.amount ? offer : max, product.offers[0]).buyerId} /></p>
                                        <p>Do you want to end the auction now?</p>
                                    </div>
                                ) : !decision ? (
                                    <div className="decision-content">
                                        <p>Buyer: <BuyerUsername buyerId={product.buyer} /></p>
                                        <p>Do you want to approve or reject this purchase request?</p>
                                        <div className="decision-buttons">
                                            <button 
                                                className="approve-decision-btn"
                                                onClick={() => setDecision('approve')}
                                            >
                                                ✓ Approve
                                            </button>
                                            <button 
                                                className="reject-decision-btn"
                                                onClick={() => setDecision('reject')}
                                            >
                                                ✕ Reject
                                            </button>
                                        </div>
                                    </div>
                                ) : decision === 'approve' ? (
                                    <div className="approve-content">
                                        <p>Are you sure you want to approve this purchase request?</p>
                                    </div>
                                ) : (
                                    <div className="reject-content">
                                        <p>Please provide a reason for rejecting this purchase:</p>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter rejection reason..."
                                            rows="4"
                                            className="rejection-textarea"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="dialog-actions">
                                {isAuctionProduct ? (
                                    <>
                                        <button className="confirm-approve-btn" onClick={handleEndAuction}>
                                            YES - End Auction
                                        </button>
                                        <button className="cancel-btn" onClick={closeDialog}>
                                            NO - Keep Running
                                        </button>
                                    </>
                                ) : !decision ? (
                                    <button className="cancel-btn" onClick={closeDialog}>
                                        Cancel
                                    </button>
                                ) : (
                                    <>
                                        <button className="back-btn" onClick={() => setDecision('')}>
                                            Back
                                        </button>
                                        <button className="cancel-btn" onClick={closeDialog}>
                                            Cancel
                                        </button>
                                        <button 
                                            className={decision === 'approve' ? 'confirm-approve-btn' : 'confirm-reject-btn'}
                                            onClick={handleConfirmDecision}
                                        >
                                            {decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
        }
        else if(isOnPage('/seller/history')) {
            //TRANSCATION HISTORY
                return (
            <div className={`product-card ${product.type.toLowerCase()} ${product.status.toLowerCase()}`}>
                <div className="card-glow"></div>
                
                <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p>{product.date}</p>
                    
                    {/* KORISTIM ISTU STRUKTURU ALI SA OSNOVNIM product-status */}
                    {product.status === 'Sold' ? ( 
                        <div className="product-status sold">
                            SOLD
                        </div>
                    ) : (
                        <>
                            <div className="product-status rejected">
                                REJECTED
                            </div>
                            {product.rejectionReason && (
                                <div className="rejection-reason-inline">
                                    <p className="reason-label">Reason:</p>
                                    <p className="reason-text">"{product.rejectionReason}"</p>
                                </div>
                            )}
                        </>
                    )}
                    
                    <p>{formatPrice(product.price)} RSD</p>
                    <HighestBidDisplay />
                </div>
                
                <div className="product-more">
                    <button className="more-btn" onClick={onMoreClick}>
                        INFO
                    </button>
                </div>
            </div>
        );
        }
        else if(isOnPage('/seller/for-sale')) {
            //FOR SALE
                return (
            <>
                <div className={`product-card ${product.type.toLowerCase()}`}>
                <div className="card-glow"></div>
                
                <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p>{product.date}</p>
                    {product.status !== 'Started' && (
                        <div className={`product-status ${product.status.toLowerCase().replace(' ', '-')}`}>
                            {product.status}
                        </div>
                    )}
                    <p>{formatPrice(product.price)} RSD</p>
                    <HighestBidDisplay />
                </div>
                
                {/* Dugmici za For - Sale */}
                <div className="product-overlay" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px'}}>
                    <button className="edit-btn" onClick={onEditClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                        </svg>
                    </button>
                    
                    <button className="more-btn" onClick={onMoreClick}>
                        INFO
                    </button>
                    
                    <button className="delete-btn" onClick={handleDeleteClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                        </svg>
                    </button>
                </div>
            </div>
            </>
        );
        }
    }
    else {
        return (
        <div className={`product-card ${product.type.toLowerCase()}`}>
            <div className="card-glow"></div>
            
            <div className="product-info">
                <h3>{product.name}</h3>
                <p>{product.category}</p>
                <p>{product.date}</p>
                {product.status !== 'Started' && (
                    <div className={`product-status ${product.status.toLowerCase().replace(' ', '-')}`}>
                        {product.status}
                    </div>
                )}
                {product.status !== 'Started' && isBuyer && isOnPage(`/profile/${user.id}`) && (
                    <div className={`product-status ${product.status.toLowerCase().replace(' ', '-')}`}>
                        PURCHASED
                    </div>
                )}
                <p>{formatPrice(product.price)} RSD</p>

                {seller && !isSeller && (isOnPageGroup('/buyer') || isOnPageGroup('admin') || isOnPage('/')) && (
                <div className="card-seller-panel">
                    <button 
                        className="card-seller-info"
                        onClick={() => !isLoggedIn ? null : navigate(`/profile/${seller.id}`)}
                        disabled={!isLoggedIn}
                    >
                        <img 
                            src={seller.image ? `/data/images/${seller.image}` : '/data/images/default.png'}
                            alt={seller.username}
                            className="card-seller-avatar"
                            onError={(e) => e.target.src = '/data/images/default.png'}
                        />
                        <div className="card-seller-details">
                            <div className="card-seller-rating">
                                <span className="card-seller-username">@{seller.username}</span>
                                <span className="card-rating-star">★</span>
                                <span className="card-rating-value">{seller.avgRating.toFixed(1)}</span>
                            </div>
                        </div>
                    </button>
                </div>
            )}

                <HighestBidDisplay />
            </div>

            <div className="product-more">
                <button className="more-btn" onClick={onMoreClick}>
                    INFO
                </button>
            </div>

            {/* Buyer controls - Buy and Bid */}
            {isLoggedIn && isBuyer && product.seller !== user.id && 
             (product.status === 'Started' || 
             (product.type === 'Auction' && product.status === 'Processing' && 
              (!product.offers || product.offers.length === 0 ||
                product.offers[product.offers.length - 1].buyerId !== user.id))) && (
                <div className="product-overlay">
                    <button className="add-to-cart-btn" onClick={handleActionClick}>
                        <div className="floating-heart"></div>
                        <div className="floating-heart"></div>
                        <div className="floating-heart"></div>
                        <div className="floating-heart"></div>
                        <div className="floating-heart"></div>
                        
                        {getButtonIcon()}
                        <span style={{zIndex: 2, position: 'relative'}}>{getButtonText()}</span>
                    </button>
                </div>
            )}
        </div>
    );
    }
}

export default ProductCard;