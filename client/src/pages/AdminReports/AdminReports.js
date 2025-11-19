import { useState, useEffect } from 'react';
import './AdminReports.css';

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectComment, setRejectComment] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [reportsRes, usersRes] = await Promise.all([
                fetch('/reports'),
                fetch('/users')
            ]);

            const reportsData = await reportsRes.json();
            const usersData = await usersRes.json();

            // Sortiranje po datumu (najnovije prvo)
            const sortedReports = reportsData.sort((a, b) => {
                return new Date(b.date.split(' ').reverse().join(' ')) - 
                       new Date(a.date.split(' ').reverse().join(' '));
            });

            setReports(sortedReports);
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

    const handleApprove = async (reportId) => {
        if (!window.confirm('Are you sure you want to approve this report? This will block the reported user and delete all their products.')) {
            return;
        }

        try {
            const response = await fetch(`/reports/${reportId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                alert('Report approved successfully! User has been blocked.');
                fetchData();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to approve report');
            }
        } catch (error) {
            console.error('Error approving report:', error);
            alert('Failed to approve report');
        }
    };

    const handleRejectClick = (report) => {
        setRejectModal(report);
        setRejectComment('');
    };

    const handleRejectConfirm = async () => {
        if (!rejectComment.trim()) {
            alert('Please provide a reason for rejecting this report.');
            return;
        }

        try {
            const response = await fetch(`/reports/${rejectModal.id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    adminComment: rejectComment
                })
            });

            if (response.ok) {
                alert('Report rejected successfully!');
                setRejectModal(null);
                setRejectComment('');
                fetchData();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to reject report');
            }
        } catch (error) {
            console.error('Error rejecting report:', error);
            alert('Failed to reject report');
        }
    };

    const handleDelete = async (reportId) => {
        if (!window.confirm('Are you sure you want to delete this report?')) {
            return;
        }

        try {
            const response = await fetch(`/reports/${reportId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Report deleted successfully!');
                fetchData();
            } else {
                const data = await response.json();
                alert(data.msg || 'Failed to delete report');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    if (loading) {
        return (
            <div className="admin-reports-page">
                <div className="admin-reports-container">
                    <div className="no-reports-message">Loading reports...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-reports-page">
            <div className="admin-reports-container">
                <div className="admin-reports-header">
                    <h1 className="admin-reports-title">Reports Management</h1>
                    <p className="admin-reports-subtitle">
                        Review and moderate user reports
                    </p>
                </div>

                {reports.length === 0 ? (
                    <div className="no-reports-message">
                        No reports found
                    </div>
                ) : (
                    <div className="reports-grid">
                        {reports.map(report => {
                            const reporter = getUserById(report.reporterId);
                            const reportedUser = getUserById(report.reportedUserId);

                            console.log('Report:', report);
                            console.log('Reporter:', reporter);
                            console.log('Reported User:', reportedUser);

                            return (
                                <div key={report.id} className="report-card">
                                    <span className={`report-status-badge status-${report.status?.toLowerCase() || 'pending'}`}>
                                        {report.status || 'Pending'}
                                    </span>

                                    <div className="report-header">
                                        <div className="report-date">{report.date}</div>

                                        <div className="user-section">
                                            <div style={{flex: 1}}>
                                                <span className="user-label">Reporter:</span>
                                                <div className="user-info">
                                                    <img
                                                        src={reporter?.image ? `/data/images/${reporter.image}` : '/data/images/default.png'}
                                                        alt={reporter?.username || 'Unknown'}
                                                        className="user-avatar"
                                                        onError={(e) => e.target.src = '/data/images/default.png'}
                                                    />
                                                    <div className="user-username">
                                                        @{reporter?.username || `User #${report.reporterId}`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="user-section">
                                            <div style={{flex: 1}}>
                                                <span className="user-label">Reported User:</span>
                                                <div className="user-info reported-user-info">
                                                    <img
                                                        src={reportedUser?.image ? `/data/images/${reportedUser.image}` : '/data/images/default.png'}
                                                        alt={reportedUser?.username}
                                                        className="user-avatar"
                                                        onError={(e) => e.target.src = '/data/images/default.png'}
                                                    />
                                                    <div className="user-username">
                                                        @{reportedUser?.username || 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="report-reason">
                                        <div className="reason-label">Reason:</div>
                                        <div className="reason-text">{report.reason}</div>
                                    </div>

                                    {report.adminComment && (
                                        <div className="admin-comment-section">
                                            <div className="admin-comment-label">Admin Comment:</div>
                                            <div className="admin-comment-text">{report.adminComment}</div>
                                        </div>
                                    )}

                                    <div className="report-actions">
                                        {report.status === 'Pending' ? (
                                            <>
                                                <button
                                                    className="approve-btn"
                                                    onClick={() => handleApprove(report.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => handleRejectClick(report)}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="delete-report-btn"
                                                onClick={() => handleDelete(report.id)}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="modal-overlay" onClick={() => setRejectModal(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Reject Report</h2>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Admin Comment:</label>
                                <textarea
                                    className="form-textarea"
                                    value={rejectComment}
                                    onChange={(e) => setRejectComment(e.target.value)}
                                    placeholder="Explain why this report is being rejected..."
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="confirm-btn" onClick={handleRejectConfirm}>
                                Confirm Rejection
                            </button>
                            <button className="cancel-btn" onClick={() => setRejectModal(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReports;