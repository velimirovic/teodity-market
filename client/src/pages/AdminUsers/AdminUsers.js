import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminUsers.css';

function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/users');
            const data = await response.json();
            // Filtriraj samo Buyer i Seller korisnike, bez Administratora
            const filteredUsers = data.filter(u => u.role !== 'Administrator');
            setUsers(filteredUsers);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
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
                fetchUsers();
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

    if (loading) {
        return (
            <div className="admin-users-page">
                <div className="admin-users-container">
                    <div className="no-users-message">Loading users...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-users-page">
            <div className="admin-users-container">
                <div className="admin-users-header">
                    <h1 className="admin-users-title">Users Management</h1>
                    <p className="admin-users-subtitle">
                        Manage and moderate all registered users
                    </p>
                </div>

                {users.length === 0 ? (
                    <div className="no-users-message">
                        No users found
                    </div>
                ) : (
                    <div className="users-grid">
                        {users.map(user => {
                            const isCurrentUser = currentUser && currentUser.id === user.id;
                            const isAdmin = user.role === 'Administrator';

                            return (
                                <div key={user.id} className="user-card">
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
                                            <span className="detail-value detail-email">{user.mail || <span className="not-defined">Not Defined</span>}</span>
                                        </div>

                                        <div className="user-detail-row">
                                            <span className="detail-label">Phone:</span>
                                            <span className="detail-value">
                                                {user.number ? user.number : <span className="not-defined">Not Defined</span>}
                                            </span>
                                        </div>

                                        <div className="user-detail-row">
                                            <span className="detail-label">Birthday:</span>
                                            <span className="detail-value">
                                                {user.birthday ? user.birthday : <span className="not-defined">Not Defined</span>}
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

                                        <div className="user-detail-row">
                                            <span className="detail-label">Reviews:</span>
                                            <span className="detail-value">{user.reviews?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="user-description">
                                        <div className="description-label">Description:</div>
                                        <div className="description-text">
                                            {user.description ? user.description : <span className="not-defined">Not Defined</span>}
                                        </div>
                                    </div>

                                    <div className="user-actions">
                                        <button
                                            className="block-user-btn"
                                            onClick={() => handleBlockUser(user.id, user.username)}
                                            disabled={isCurrentUser || isAdmin}
                                            title={isCurrentUser ? "You cannot block yourself" : isAdmin ? "Cannot block administrators" : "Block this user"}
                                        >
                                            {isCurrentUser ? "Current User" : isAdmin ? "Administrator" : "Block User"}
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

export default AdminUsers;