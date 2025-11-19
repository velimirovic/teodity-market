import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminSuspiciousUsers.css';

function AdminSuspiciousUsers() {
    const [suspiciousUsers, setSuspiciousUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchSuspiciousUsers();
    }, []);

    const fetchSuspiciousUsers = async () => {
        try {
            const response = await fetch('/users/suspicious');
            const data = await response.json();
            setSuspiciousUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching suspicious users:', error);
            setLoading(false);
        }
    };

    const handleBlockUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to block user @${username}? This will delete all their products.`)) {
            return;
        }

        try {
            const response = await fetch(`/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert(`User @${username} has been blocked successfully!`);
                fetchSuspiciousUsers();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to block user');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            alert('Failed to block user');
        }
    };

    const renderRating = (avgRating) => {
        const rating = avgRating !== undefined && avgRating !== null ? avgRating : 0;
        return (
            <div className="user-rating">
                <span className="rating-star-icon">★</span>
                <span className="detail-value">{rating.toFixed(1)}</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        // Vraća samo datum bez vremena
        return dateString.split(' ')[0];
    };

    if (loading) {
        return (
            <div className="admin-suspicious-users-page">
                <div className="admin-suspicious-users-container">
                    <div className="loading-container">
                        <div className="loading-text-container">
                            <h2 className="loading-title">Loading Suspicious Users...</h2>
                            <div className="dot-container">
                                <div className="dot dot-1"></div>
                                <div className="dot dot-2"></div>
                                <div className="dot dot-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-suspicious-users-page">
            <div className="admin-suspicious-users-container">
                <div className="admin-suspicious-users-header">
                    <h1 className="admin-suspicious-users-title">Suspicious Users</h1>
                    <p className="admin-suspicious-users-subtitle">
                        Users with more than 5 cancellations in the last 30 days
                    </p>
                </div>

                {suspiciousUsers.length === 0 ? (
                    <div className="empty-state-container">
                        <div className="empty-state-card">
                            <div className="empty-state-icon">✓</div>
                            <h2 className="empty-state-title">All Clear!</h2>
                            <p className="empty-state-message">
                                No suspicious users found. All buyers are behaving well.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="users-grid">
                        {suspiciousUsers.map(user => {
                            const isCurrentUser = currentUser && currentUser.id === user.id;

                            return (
                                <div key={user.id} className="user-card suspicious-card">
                                    <div className="suspicious-badge">
                                        ⚠️ {user.cancellationCount} Cancellations
                                    </div>

                                    <span className={`user-role-badge role-${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>

                                    <div className="user-header">
                                        <img
                                            src={user.image ? `/data/images/${user.image}` : '/data/images/default.png'}
                                            alt={user.username}
                                            className="user-avatar-large"
                                            onError={(e) => e.target.src = '/data/images/default.png'}
                                        />
                                        <div className="user-basic-info">
                                            <div className="user-full-name">
                                                {user.name} {user.surname}
                                            </div>
                                            <div className="user-username-display">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="user-details">
                                        <div className="user-detail-row">
                                            <span className="detail-label">Email:</span>
                                            <span className="detail-value detail-email">
                                                {user.mail || <span className="not-defined">Not Defined</span>}
                                            </span>
                                        </div>

                                        <div className="user-detail-row">
                                            <span className="detail-label">Phone:</span>
                                            <span className="detail-value">
                                                {user.number ? user.number : <span className="not-defined">Not Defined</span>}
                                            </span>
                                        </div>

                                        <div className="user-detail-row">
                                            <span className="detail-label">Rating:</span>
                                            {renderRating(user.avgRating)}
                                        </div>

                                        <div className="user-detail-row">
                                            <span className="detail-label">Products:</span>
                                            <span className="detail-value">{user.products?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="cancellations-section">
                                        <div className="cancellations-label">Recent Cancellations:</div>
                                        <div className="cancellations-list">
                                            {user.recentCancellations.slice(0, 5).map((cancellation, index) => (
                                                <div key={index} className="cancellation-item">
                                                    <span className="cancellation-product">
                                                        {cancellation.productName}
                                                    </span>
                                                    <span className="cancellation-date">
                                                        {formatDate(cancellation.date)}
                                                    </span>
                                                </div>
                                            ))}
                                            {user.recentCancellations.length > 5 && (
                                                <div className="cancellation-item more-cancellations">
                                                    + {user.recentCancellations.length - 5} more...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="user-actions">
                                        <button
                                            className="block-user-btn"
                                            onClick={() => handleBlockUser(user.id, user.username)}
                                            disabled={isCurrentUser}
                                            title={isCurrentUser ? "You cannot block yourself" : "Block this user"}
                                        >
                                            {isCurrentUser ? "Current User" : "Block User"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminSuspiciousUsers;