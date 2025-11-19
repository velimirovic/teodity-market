import "./NavBar.css"
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";
import { useState } from 'react';

function NavBar() {
    const navigate = useNavigate();
    const { user, isLoggedIn, isBuyer, logout, isSeller, isAdmin } = useAuth();
    const [sellerDropdownOpen, setSellerDropdownOpen] = useState(false);
    const [buyerDropdownOpen, setBuyerDropdownOpen] = useState(false);

    console.log('NavBar debug:', { user, isLoggedIn, isBuyer, isSeller, isAdmin });

    const onAddClick = () => {
        navigate(`/add`);
    };

    const onProfileClick = () => {
        navigate(`/profile/${user.id}`);
    };

    const onSignInClick = () => {
        navigate('/sign-in');
    };

    const onSignUpClick = () => {
        navigate('/sign-up');
    };
    
    const onLogOutClick = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            logout();
            navigate('/');
        }
    };

    const toggleSellerDropdown = () => {
        setSellerDropdownOpen(!sellerDropdownOpen);
        setBuyerDropdownOpen(false);
    };

    const toggleBuyerDropdown = () => {
        setBuyerDropdownOpen(!buyerDropdownOpen);
        setSellerDropdownOpen(false);
    };

    const closeDropdowns = () => {
        setSellerDropdownOpen(false);
        setBuyerDropdownOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <h2>Teodity Market</h2>
                </div>
                <div className='navbar-links'>
                    {(!isLoggedIn || isSeller) && (
                        <Link to="/" className='nav-link'>Home</Link>
                    )}
                    
                    {isBuyer && (
                        <Link to="/buyer/shop" className='nav-link'>Shop</Link>
                    )}
                    
                    {isSeller && (
                        <div className="dropdown-container">
                            <button 
                                className='nav-link dropdown-trigger'
                                onClick={toggleSellerDropdown}
                            >
                                Manage Products
                                <svg 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    className={`dropdown-arrow ${sellerDropdownOpen ? 'rotated' : ''}`}
                                >
                                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
                                </svg>
                            </button>
                            
                            {sellerDropdownOpen && (
                                <div className="dropdown-menu">
                                    <Link 
                                        to="/seller/for-sale" 
                                        className='dropdown-item'
                                        onClick={closeDropdowns}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        For Sale
                                    </Link>
                                    <Link 
                                        to="/seller/pending" 
                                        className='dropdown-item'
                                        onClick={closeDropdowns}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        To Be Marked
                                    </Link>
                                    <Link 
                                        to="/seller/history" 
                                        className='dropdown-item'
                                        onClick={closeDropdowns}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3V21H21V3H3ZM19 19H5V5H19V19ZM17 7H7V9H17V7ZM17 11H7V13H17V11ZM17 15H7V17H17V15Z" fill="currentColor"/>
                                        </svg>
                                        Transaction History
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {isBuyer && (
                        <div className="dropdown-container">
                            <button 
                                className='nav-link dropdown-trigger'
                                onClick={toggleBuyerDropdown}
                            >
                                My Orders
                                <svg 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    className={`dropdown-arrow ${buyerDropdownOpen ? 'rotated' : ''}`}
                                >
                                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
                                </svg>
                            </button>
                            
                            {buyerDropdownOpen && (
                                <div className="dropdown-menu">
                                    <Link 
                                        to={`/buyer/cart/${user.id}`}
                                        className='dropdown-item'
                                        onClick={closeDropdowns}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17C17 18.1 16.1 19 15 19H9C7.9 19 7 18.1 7 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Cart
                                    </Link>
                                    <Link 
                                        to={`/buyer/history/${user.id}`}
                                        className='dropdown-item'
                                        onClick={closeDropdowns}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="currentColor"/>
                                        </svg>
                                        Purchase History
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADMIN LINKS - BEZ DROPDOWN-A */}
                    {isAdmin && (
                        <>
                            <Link to="/admin/users" className='nav-link'>Users</Link>
                            <Link to="/admin/reviews" className='nav-link'>Reviews</Link>
                            <Link to="/admin/reports" className='nav-link'>Reports</Link>
                            <Link to="/admin/suspicious-users" className='nav-link'>Suspicious Users</Link>
                        </>
                    )}
                </div>
            </div>
            
            {isLoggedIn && isBuyer && (
                <div className="navbar-right">
                    <div className="dropdown-container">
                        <button 
                            className="profile-avatar"
                            onClick={onProfileClick}
                        >
                            <img 
                                src={`/data/images/${user.image || 'default.png'}`}
                                alt={user.username}
                                onError={(e) => e.target.src = '/data/images/default.png'}
                            />
                        </button>
                    </div>
                    <button className="log-out" onClick={onLogOutClick}>
                        Log Out
                    </button>
                </div>
            )}
            {isLoggedIn && isSeller && (
                <div className="navbar-right">
                    <button className="navbar-icon" onClick={onAddClick}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#5D2A3D" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                    </button>
                    
                    <div className="dropdown-container">
                        <button 
                            className="profile-avatar"
                            onClick={onProfileClick}
                        >
                            <img 
                                src={`/data/images/${user.image || 'default.png'}`}
                                alt={user.username}
                                onError={(e) => e.target.src = '/data/images/default.png'}
                            />
                        </button>
                    </div>
                    
                    <button className="log-out" onClick={onLogOutClick}>
                        Log Out
                    </button>
                </div>
            )}
            {isLoggedIn && isAdmin && (
                <div className="navbar-right">
                    <button onClick={onLogOutClick} className="log-out">
                        Log Out
                    </button>
                </div>
            )}
            {
                !isLoggedIn && (
                    <div className="navbar-right">
                        <button className="sign-in" onClick={onSignInClick}>
                            Sign In
                        </button>
                        <button className="sign-up" onClick={onSignUpClick}>
                            Sign Up    
                        </button>
                    </div>
                )
            }
        </nav>
    )
}

export default NavBar;