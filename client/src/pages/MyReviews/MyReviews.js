import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './MyReviews.css';

function MyReviews() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myReviews, setMyReviews] = useState([]);
    const [reviewedUsers, setReviewedUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchMyReviews();
    }, [user]);

    const fetchMyReviews = async () => {
        try {
            // Uzmi recenzije koje sam ja dao drugima
            const response = await fetch(`/reviews/by-user/${user.id}`);
            if (!response.ok) throw new Error('Failed to fetch reviews');
            
            const reviews = await response.json();
            setMyReviews(reviews);

            // Uzmi detalje korisnika za svakog koga sam recenzirao
            const userPromises = reviews.map(review => 
                fetch(`/users/${review.reviewedUserId}`).then(res => res.json())
            );
            
            const users = await Promise.all(userPromises);
            const usersMap = {};
            users.forEach(u => {
                usersMap[u.id] = u;
            });
            
            setReviewedUsers(usersMap);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Greška pri učitavanju recenzija');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="my-reviews-page">
                <div className="my-reviews-header">
                    <button onClick={() => navigate(`/profile/${user?.id}`)} className="back-link-main">
                        ← Back to Profile
                    </button>
                </div>
                <div className="loading-container">
                    <div className="loading-text-container">
                        <h2 className="loading-title">Loading Reviews...</h2>
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
            <div className="my-reviews-page">
                <div className="my-reviews-header">
                    <button onClick={() => navigate(`/profile/${user?.id}`)} className="back-link-main">
                        ← Back to Profile
                    </button>
                </div>
                <div className="error-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-reviews-page">
            <div className="my-reviews-header">
                <button onClick={() => navigate(`/profile/${user?.id}`)} className="back-link-main">
                    ← Back to Profile
                </button>
            </div>

            <div className="my-reviews-container">
                <div className="page-header">
                    <div className="header-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="white"/>
                        </svg>
                    </div>
                    <h1 className="page-title">My Reviews</h1>
                    <p className="page-subtitle">Reviews you've given to other users</p>
                </div>

                {myReviews.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" fill="white"/>
                            </svg>
                        </div>
                        <h2 className="empty-message">No Reviews Yet</h2>
                        <p className="empty-subtitle">
                            You haven't left any reviews. Complete transactions to be able to review other users.
                        </p>
                    </div>
                ) : (
                    <div className="reviews-list">
                        {myReviews.map(review => {
                            const reviewedUser = reviewedUsers[review.reviewedUserId];
                            return (
                                <div key={review.id} className="review-item-card">
                                    <div className="review-item-header">
                                        <button 
                                            onClick={() => navigate(`/profile/${review.reviewedUserId}`)}
                                            className="reviewed-user-info"
                                        >
                                            <img 
                                                src={reviewedUser?.image ? `/data/images/${reviewedUser.image}` : '/data/images/default.png'}
                                                alt={reviewedUser?.username || 'User'}
                                                className="user-avatar-small"
                                                onError={(e) => e.target.src = '/data/images/default.png'}
                                            />
                                            <div className="user-details">
                                                <h3 className="user-name">
                                                    {reviewedUser?.name} {reviewedUser?.surname}
                                                </h3>
                                                <p className="user-username">@{reviewedUser?.username}</p>
                                            </div>
                                        </button>
                                        <div className="review-meta">
                                            <div className="review-rating-display">
                                                {'★'.repeat(review.grade)}
                                                {'☆'.repeat(5 - review.grade)}
                                            </div>
                                            <span className="review-date-small">{review.date}</span>
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <div className="review-comment-box">
                                            <p className="review-comment-text">{review.comment}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {myReviews.length > 0 && (
                    <div className="reviews-info">
                        <p className="info-text">
                            You can view reviews from other users you've reviewed by visiting their profiles.
                        </p>
                    </div>
                )}
            </div>

            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
            <div className="circle-3"></div>
        </div>
    );
}

export default MyReviews;