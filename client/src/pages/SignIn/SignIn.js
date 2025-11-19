import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import "./SignIn.css";

function SignIn() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (errorMessage) {
            setErrorMessage('');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

     useEffect(() => {
        const rememberedUsername = localStorage.getItem('rememberedUsername');
        if (rememberedUsername) {
            setFormData(prev => ({
                ...prev,
                username: rememberedUsername,
                rememberMe: true
            }));
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            alert('Please fill in all required fields');
            return;
        }
        fetch('/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Login failed');
                }
                return res.json();
            })
            .then((data) => {
                alert('Login successful!');
                login(data.user);
                if (formData.rememberMe) {
                    localStorage.setItem('rememberedUsername', formData.username);
                }
                else {
                    localStorage.removeItem('rememberedUsername');
                }
                
                // Redirect na osnovu uloge korisnika
                    if (data.user.role === 'Administrator') {
                        navigate('/admin/users');
                    } else if (data.user.role === 'Buyer') {
                        navigate('/buyer/shop');
                    } else if (data.user.role === 'Seller') {
                        navigate('/');
                    } else {
                        navigate('/');
                    }
                })
            .catch(error => {
                console.error('Error:', error);
                alert('Incorrect username or password');
            });
    }


    return (
        <>
            <div className="signin-page">
                <div className="signin-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>

                <div className="signin-container">
                    <div className="signin-form-wrapper">
                        <div className="form-header">
                            <div className="header-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H11V21H5V3H14V8H21ZM18 19H20V13H22L19 10L16 13H18V19Z" fill="white"/>
                                </svg>
                            </div>
                            <h1>Sign In</h1>
                            <p className="contact-info">teodity-market@domain.com | Novi Sad, Serbia</p>
                        </div>

                        <div className="welcome-message">
                            <h3>Welcome Back!</h3>
                            <p>Please sign in to access your Teodity Market account and continue your shopping experience.</p>
                        </div>

                        {errorMessage && (
                            <div className="error-message">
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="signin-form">
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="Enter your username"
                                    required
                                    autoComplete="username"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="password-group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePasswordVisibility}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 7C6.48 7 2 9.24 2 12C2 14.76 6.48 17 12 17S22 14.76 22 12C22 9.24 17.52 7 12 7ZM12 15C10.34 15 9 13.66 9 12S10.34 9 12 9S15 10.34 15 12S13.66 15 12 15ZM12 11C11.45 11 11 11.45 11 12S11.45 13 12 13S13 12.55 13 12S12.55 11 12 11Z" fill="currentColor"/>
                                                <path d="M3 3L21 21M9.9 4.24A9.12 9.12 0 0112 4C16.5 4 20.27 6.61 21.72 10.5C21.38 11.44 20.87 12.3 20.22 13.06M14.12 14.12A3 3 0 019.88 9.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            </svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="form-options">
                                <div className="remember-me">
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        name="rememberMe"
                                        checked={formData.rememberMe}
                                        onChange={handleInputChange}
                                    />
                                    <label htmlFor="rememberMe">Remember me</label>
                                </div>
                                <Link to="/forgot-password" className="forgot-password">
                                    Forgot password?
                                </Link>
                            </div>

                            <button 
                                type="submit" 
                                className="signin-btn"
                            >
                                Sign In
                            </button>
                        </form>

                        <div className="divider">
                            Don't have an account?
                        </div>

                        <div className="signup-link">
                            <Link to="/sign-up">Create Account</Link>
                        </div>
                    </div>
                </div>

                <div className="decorative-circle circle-1"></div>
                <div className="decorative-circle circle-2"></div>
                <div className="decorative-circle circle-3"></div>
            </div>
        </>
    );
}

export default SignIn;