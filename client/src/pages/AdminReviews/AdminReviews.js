import { useState, useEffect } from 'react';
import './AdminReviews.css';

function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingReview, setEditingReview] = useState(null);
    const [editGrade, setEditGrade] = useState(0);
    const [editComment, setEditComment] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reviewsRes, usersRes] = await Promise.all([
                fetch('/reviews'),
                fetch('/users')
            ]);

            const reviewsData = await reviewsRes.json();
            const usersData = await usersRes.json();

            // Sortiranje po datumu (najnovije prvo)
            const sortedReviews = reviewsData.sort((a, b) => {
                return new Date(b.date.split(' ').reverse().join(' ')) - 
                       new Date(a.date.split(' ').reverse().join(' '));
            });

            setReviews(sortedReviews);
            setUsers(usersData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const getUserById = (id) => {
        return users.find(u => u.id === id);
    };

    const handleEdit = (review) => {
        setEditingReview(review);
        setEditGrade(review.grade);
        setEditComment(review.comment);
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`/reviews/${editingReview.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grade: editGrade,
                    comment: editComment
                })
            });

            if (response.ok) {
                alert('Review updated successfully!');
                setEditingReview(null);
                fetchData();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to update review');
            }
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review');
        }
    };

    const handleDelete = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await fetch(`/reviews/${reviewId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Review deleted successfully!');
                fetchData();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to delete review');
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            alert('Failed to delete review');
        }
    };

    const renderStars = (grade) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={i <= grade ? 'star-filled' : 'star-empty'}>
                    ★
                </span>
            );
        }
        return stars;
    };

    const renderEditStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`rating-star ${i <= editGrade ? 'active' : ''}`}
                    onClick={() => setEditGrade(i)}
                >
                    ★
                </span>
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="admin-reviews-page">
                <div className="admin-reviews-container">
                    <div className="no-reviews-message">Loading reviews...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-reviews-page">
            <div className="admin-reviews-container">
                <div className="admin-reviews-header">
                    <h1 className="admin-reviews-title">Reviews Management</h1>
                    <p className="admin-reviews-subtitle">
                        Manage and moderate all user reviews
                    </p>
                </div>

                {reviews.length === 0 ? (
                    <div className="no-reviews-message">
                        No reviews found
                    </div>
                ) : (
                    <div className="reviews-grid">
                        {reviews.map(review => {
                            const reviewer = getUserById(review.reviewerId);
                            const reviewedUser = getUserById(review.reviewedUserId);

                            return (
                                <div key={review.id} className="review-card">
                                    <div className="review-header">
                                        <div className="reviewer-info">
                                            <img
                                                src={reviewer?.image ? `/data/images/${reviewer.image}` : '/data/images/default.png'}
                                                alt={reviewer?.username}
                                                className="reviewer-avatar"
                                                onError={(e) => e.target.src = '/data/images/default.png'}
                                            />
                                            <div className="reviewer-details">
                                                <div className="reviewer-username">
                                                    @{reviewer?.username || 'Unknown'}
                                                </div>
                                                <div className="review-date">{review.date}</div>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            {renderStars(review.grade)}
                                        </div>
                                    </div>

                                    <div className="reviewed-user-section">
                                        <div className="reviewed-user-label">Reviewed User:</div>
                                        <div className="reviewed-user-info">
                                            <img
                                                src={reviewedUser?.image ? `/data/images/${reviewedUser.image}` : '/data/images/default.png'}
                                                alt={reviewedUser?.username}
                                                className="reviewed-user-avatar"
                                                onError={(e) => e.target.src = '/data/images/default.png'}
                                            />
                                            <div className="reviewed-username">
                                                @{reviewedUser?.username || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="review-comment">
                                        {review.comment || 'No comment provided.'}
                                    </div>

                                    <div className="review-actions">
                                        <button
                                            className="edit-review-btn"
                                            onClick={() => handleEdit(review)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="delete-review-btn"
                                            onClick={() => handleDelete(review.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingReview && (
                <div className="modal-overlay" onClick={() => setEditingReview(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Edit Review</h2>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Rating:</label>
                                <div className="rating-input">
                                    {renderEditStars()}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Comment:</label>
                                <textarea
                                    className="form-textarea"
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    placeholder="Enter review comment..."
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="save-btn" onClick={handleSaveEdit}>
                                Save Changes
                            </button>
                            <button className="cancel-btn" onClick={() => setEditingReview(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReviews;