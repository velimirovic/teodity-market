import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { useNavigation } from '../../contexts/NavigationContext';
import './UserProfile.css';

function UserProfile() {
    // Uzmi userId iz URL-a (npr. /profile/4)
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { user, isLoggedIn, isBuyer, logout, isSeller, isAdmin } = useAuth();
    const { previousPage,isPreviousPage, isPreviousPageGroup, isOnPage } = useNavigation();
    const [profileUser, setProfileUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewers, setReviewers] = useState({});
    const [activeTab, setActiveTab] = useState('products');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canLeaveReview, setCanLeaveReview] = useState(false);
    const [hasLeftReview, setHasLeftReview] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewForm, setReviewForm] = useState({ grade: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    
    // Report state
    const [canReport, setCanReport] = useState(false);
    const [hasReported, setHasReported] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const isOwnProfile = currentUser?.id === parseInt(userId);

    useEffect(() => {
        if (userId) {
            // Reset state kada se promeni userId
            setProfileUser(null);
            setProducts([]);
            setReviews([]);
            setReviewers({});
            setActiveTab('products'); // Resetuj na Products tab
            setLoading(true);
            setError(null);
            setCanLeaveReview(false);
            setHasLeftReview(false);
            setCanReport(false);
            setHasReported(false);
            
            fetchUserProfile();
        }
    }, [userId]);

    useEffect(() => {
        if (profileUser) {
            fetchUserProducts();
            checkReviewStatus();
            checkReportStatus();
        }
    }, [profileUser]);

    useEffect(() => {
        if ((hasLeftReview || isOwnProfile) && profileUser) {
            fetchUserReviews();
        }
    }, [hasLeftReview, isOwnProfile, profileUser]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`/users/${userId}`);
            if (!response.ok) {
                throw new Error('User not found');
            }
            const data = await response.json();
            setProfileUser(data);
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchUserProducts = async () => {
        try {
            const response = await fetch(`/products`);
            if (!response.ok) throw new Error('Failed to fetch products');
            const allProducts = await response.json();
            
            // Za Seller-a prikaži proizvode koje trenutno prodaje (aktivni listing-i)
            // Za Buyer-a prikaži proizvode koje je kupio
            let userProducts;
            if (profileUser?.role === 'Seller') {
                userProducts = allProducts.filter(p => 
                    p.seller === parseInt(userId) && 
                    !p.deleted &&
                    ((p.type === 'Fixed' && p.status === 'Started') ||
                     (p.type === 'Auction' && (p.status === 'Started' || p.status === 'Processing')))
                );
            } else if (profileUser?.role === 'Buyer') {
                // Prikaži proizvode koje je kupio (status Sold i on je buyer)
                userProducts = allProducts.filter(p => 
                    p.buyer === parseInt(userId) && 
                    p.status === 'Sold' && 
                    !p.deleted
                );
            } else {
                userProducts = [];
            }
            
            setProducts(userProducts);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserReviews = async () => {
        try {
            const response = await fetch(`/reviews/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            const data = await response.json();
            setReviews(data);
            
            // Fetch reviewer details for each review
            const reviewerPromises = data.map(review => 
                fetch(`/users/${review.reviewerId}`).then(res => res.json())
            );
            
            const reviewerUsers = await Promise.all(reviewerPromises);
            const reviewersMap = {};
            reviewerUsers.forEach(u => {
                reviewersMap[u.id] = u;
            });
            
            setReviewers(reviewersMap);
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    };

    const checkReviewStatus = async () => {
        if (!currentUser || isOwnProfile) {
            setCanLeaveReview(false);
            return;
        }

        try {
            // Proveri da li je trenutni korisnik već ostavio recenziju
            const reviewsResponse = await fetch(`/reviews/by-user/${currentUser.id}`);
            const userReviews = await reviewsResponse.json();
            const alreadyReviewed = userReviews.some(r => r.reviewedUserId === parseInt(userId));
            
            setHasLeftReview(alreadyReviewed);

            if (alreadyReviewed) {
                setCanLeaveReview(false);
                return;
            }

            // Proveri da li postoji završena transakcija
            const productsResponse = await fetch('/products');
            const allProducts = await productsResponse.json();
            
            const hasTransaction = allProducts.some(p => 
                p.status === 'Sold' && 
                ((p.buyer === currentUser.id && p.seller === parseInt(userId)) ||
                 (p.seller === currentUser.id && p.buyer === parseInt(userId)))
            );

            setCanLeaveReview(hasTransaction);
        } catch (err) {
            console.error('Error checking review status:', err);
        }
    };

    const checkReportStatus = async () => {
        if (!currentUser || isOwnProfile) {
            setCanReport(false);
            return;
        }

        try {
            // Proveri da li je korisnik već prijavio ovog korisnika
            const reportsResponse = await fetch('/reports');
            const allReports = await reportsResponse.json();
            const alreadyReported = allReports.some(r => 
                r.reporterId === currentUser.id && 
                r.reportedUserId === parseInt(userId) &&
                r.status === 'Pending'
            );

            setHasReported(alreadyReported);

            if (alreadyReported) {
                setCanReport(false);
                return;
            }

            // Proveri da li postoji završena transakcija
            const productsResponse = await fetch('/products');
            const allProducts = await productsResponse.json();
            
            const hasTransaction = allProducts.some(p => 
                p.status === 'Sold' && 
                ((p.buyer === currentUser.id && p.seller === parseInt(userId)) ||
                 (p.seller === currentUser.id && p.buyer === parseInt(userId)))
            );

            setCanReport(hasTransaction);
        } catch (err) {
            console.error('Error checking report status:', err);
        }
    };

    const handleLeaveReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reviewerId: currentUser.id,
                    reviewedUserId: parseInt(userId),
                    grade: parseInt(reviewForm.grade),
                    comment: reviewForm.comment
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Failed to submit review');
            }

            setShowReviewModal(false);
            setReviewForm({ grade: 5, comment: '' });
            setHasLeftReview(true);
            setCanLeaveReview(false);
            fetchUserProfile();
            fetchUserReviews();
            alert('Review added successfully!');
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReportUser = async (e) => {
        e.preventDefault();
        
        if (!reportReason.trim()) {
            alert('Please enter a reason for the report!');
            return;
        }

        setReportSubmitting(true);

        try {
            const response = await fetch('/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporterId: currentUser.id,
                    reportedUserId: parseInt(userId),
                    reason: reportReason.trim()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Failed to submit report');
            }

            setShowReportModal(false);
            setReportReason('');
            setHasReported(true);
            setCanReport(false);
            alert('Report submitted successfully! The administrator will review it.');
        } catch (err) {
            alert(err.message);
        } finally {
            setReportSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">Loading Profile...</h2>
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

    if (error || !profileUser) {
        return (
            <div className="profile-page">
                <div className="error-container">
                    <div className="error-message">{error || 'User not found'}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {user && !isOnPage(`/profile/${user.id}`) &&
                <div className="product-info-toolbar">
                    <Link to={`/profile/${user?.id}`} className="back-link-main">← Back to Profile</Link>
                </div>
            }
            <div className="profile-container">
                <div className="profile-info-card">
                    <div className="profile-avatar">
                        <img 
                            src={profileUser.image ? `/data/images/${profileUser.image}` : '/data/images/default.png'} 
                            alt={profileUser.name}
                            onError={(e) => e.target.src = '/data/images/default.png'}
                        />
                    </div>
                    <div className="profile-details">
                        <h1 className="profile-name">{profileUser.name} {profileUser.surname}</h1>
                        <p className="profile-username">@{profileUser.username}</p>
                        <div className="profile-rating">
                            <span className="rating-stars">{'★'.repeat(Math.round(profileUser.avgRating))}</span>
                            <span className="rating-number">{profileUser.avgRating.toFixed(1)}</span>
                            <span className="rating-count">({reviews.length} Reviews)</span>
                        </div>
                        {profileUser.description && (
                            <p className="profile-description">{profileUser.description}</p>
                        )}
                        <div className="profile-meta">
                            <span className="profile-role">{profileUser.role}</span>
                            {profileUser.number && <span className="profile-contact">📞 {profileUser.number}</span>}
                        </div>
                    </div>
                </div>

                {isOwnProfile && (
                    <div className="profile-actions">
                        <button 
                            className="action-button primary"
                            onClick={() => navigate('/my-reviews')}
                        >
                            My Reviews
                        </button>
                        <button 
                            className="action-button secondary"
                            onClick={() => navigate(`/edit-profile/${user.id}`)}
                        >
                            Edit Profile
                        </button>
                    </div>
                )}

                {!isOwnProfile && (canLeaveReview || canReport) && (
                    <div className="profile-actions">
                        {canLeaveReview && (
                            <button 
                                className="action-button primary leave-review-btn"
                                onClick={() => setShowReviewModal(true)}
                            >
                                Leave Review
                            </button>
                        )}
                        {canReport && (
                            <button 
                                className="action-button danger report-btn"
                                onClick={() => setShowReportModal(true)}
                            >
                                Report User
                            </button>
                        )}
                    </div>
                )}

                {!isOwnProfile && !canLeaveReview && !hasLeftReview && !canReport && !hasReported && (
                    <div className="profile-info-message">
                        <p>You can leave a review or report this user after completing a transaction with them.</p>
                    </div>
                )}

                {!isOwnProfile && hasReported && (
                    <div className="profile-info-message warning">
                        <p>You have already submitted a report for this user. The administrator will review it.</p>
                    </div>
                )}

                <div className="profile-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        Products ({products.length})
                    </button>
                    {(hasLeftReview || isOwnProfile) && (
                        <button 
                            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            Reviews ({reviews.length})
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    {activeTab === 'products' && (
                        <div className="products-grid">
                            {products.length === 0 ? (
                                <div className="empty-state">
                                    <p>No products available</p>
                                </div>
                            ) : (
                                products.map(product => (
                                    <ProductCard 
                                        key={product.id} 
                                        product={product}
                                        showInfoOnly={true}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-container">
                            {reviews.length === 0 ? (
                                <div className="empty-state">
                                    <p>No reviews yet</p>!
                                </div>
                            ) : (
                                reviews.map(review => {
                                    const reviewer = reviewers[review.reviewerId];
                                    return (
                                        <div key={review.id} className="review-card">
                                            <div className="review-header">
                                                <button 
                                                    onClick={() => navigate(`/profile/${review.reviewerId}`)}
                                                    className="reviewer-info"
                                                >
                                                    <img 
                                                        src={reviewer?.image ? `/data/images/${reviewer.image}` : '/data/images/default.png'}
                                                        alt={reviewer?.username || 'User'}
                                                        className="reviewer-avatar"
                                                        onError={(e) => e.target.src = '/data/images/default.png'}
                                                    />
                                                    <span className="reviewer-username">@{reviewer?.username}</span>
                                                </button>
                                                <div className="review-rating-date">
                                                    <div className="review-rating">
                                                        {'★'.repeat(review.grade)}
                                                        {'☆'.repeat(5 - review.grade)}
                                                    </div>
                                                    <span className="review-date">{review.date}</span>
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="review-comment">{review.comment}</p>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Leave a Review</h2>
                            <button className="close-button" onClick={() => setShowReviewModal(false)}>×</button>
                        </div>
                        <div className="review-form">
                            <div className="form-group">
                                <label>Rating</label>
                                <div className="star-rating">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <span
                                            key={star}
                                            className={`star ${star <= reviewForm.grade ? 'active' : ''}`}
                                            onClick={() => setReviewForm({ ...reviewForm, grade: star })}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Comment (optional)</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                    placeholder="Share your experience..."
                                    rows={4}
                                />
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowReviewModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="submit-button"
                                    onClick={handleLeaveReview}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Report User</h2>
                            <button className="close-button" onClick={() => setShowReportModal(false)}>×</button>
                        </div>
                        <div className="report-form">
                            <div className="form-group">
                                <label>Reason for Report</label>
                                <textarea
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    placeholder="Please describe the issue you experienced with this user..."
                                    rows={6}
                                    className="report-textarea"
                                />
                                <p className="form-helper-text">
                                    Please provide detailed information about why you are reporting this user. 
                                    The administrator will review your report.
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="cancel-button"
                                    onClick={() => setShowReportModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    className="submit-button danger-submit"
                                    onClick={handleReportUser}
                                    disabled={reportSubmitting}
                                >
                                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfile;