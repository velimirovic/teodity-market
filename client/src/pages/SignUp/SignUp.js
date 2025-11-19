import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./SignUp.css";

function SignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        role: '',
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

     const validateForm = () => {
        // Proverava da li su sva obavezna polja popunjena
        if (!formData.role || !formData.firstName || !formData.lastName || 
            !formData.username || !formData.email || !formData.phoneNumber || 
            !formData.password || !formData.confirmPassword) {
            alert('Please fill in all required fields');
            return false;
        }

        // Validacija imena i prezimena (samo slova, min 2 karaktera)
        const nameRegex = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;
        if (!nameRegex.test(formData.firstName.trim())) {
            alert('First name must contain only letters and be at least 2 characters long');
            return false;
        }
        if (!nameRegex.test(formData.lastName.trim())) {
            alert('Last name must contain only letters and be at least 2 characters long');
            return false;
        }

        // Proverava format email adrese
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address');
            return false;
        }

        // Validacija broja telefona (minimalno 9 cifara)
        const phoneRegex = /^(\+381|0)?6[0-9]{7,8}$/;
        if (!phoneRegex.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
            alert('Please enter a valid mobile number (e.g., 0638107245 or +381638107245)');
            return false;
        }

        // Proverava da li se lozinke poklapaju
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return false;
        }

        // Proverava jačinu lozinke - svi kriterijumi
        if (formData.password.length < 8) {
            alert('Password must be at least 8 characters long');
            return false;
        }
        if (!/[a-z]/.test(formData.password)) {
            alert('Password must contain at least one lowercase letter');
            return false;
        }
        if (!/[A-Z]/.test(formData.password)) {
            alert('Password must contain at least one uppercase letter');
            return false;
        }
        if (!/\d/.test(formData.password)) {
            alert('Password must contain at least one number');
            return false;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
            alert('Password must contain at least one special character');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            const res = await fetch('/users/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.firstName,
                    surname: formData.lastName,
                    username: formData.username,
                    mail: formData.email,
                    number: formData.phoneNumber,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    role: formData.role === 'buyer' ? 'Buyer' : 'Seller'
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Registration successful! Please sign in.');
                navigate('/sign-in');
            } else {
                alert(data.msg || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Network error. Please try again.');
        }
    };

    return (
        <>
            <div className="signup-page">
                <div className="signup-header">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>

                <div className="signup-container">
                    <div className="signup-form-wrapper">
                        <div className="form-header">
                            <div className="header-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>
                                </svg>
                            </div>
                            <h1>Sign Up</h1>
                            <p className="contact-info">teodity-market@domain.com | Novi Sad, Serbia</p>
                        </div>

                        <form onSubmit={handleSubmit} className="signup-form">
                            <div className="form-group">
                                <label>Choose Your Role *</label>
                                <div className="role-selector">
                                    <div className="role-option">
                                        <input
                                            type="radio"
                                            id="buyer"
                                            name="role"
                                            value="buyer"
                                            checked={formData.role === 'buyer'}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <label htmlFor="buyer" className="role-label">
                                            <svg className="role-icon" viewBox="0 0 16 16" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.5 3.5a2.5 2.5 0 0 0-5 0V4h5zm1 0V4H15v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4h3.5v-.5a3.5 3.5 0 1 1 7 0M14 14V5H2v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1M8 7.993c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132"/>
                                            </svg>
                                            <div className="role-name">Buyer</div>
                                            <div className="role-description">Browse and purchase products from sellers</div>
                                        </label>
                                    </div>
                                    <div className="role-option">
                                        <input
                                            type="radio"
                                            id="seller"
                                            name="role"
                                            value="seller"
                                            checked={formData.role === 'seller'}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <label htmlFor="seller" className="role-label">
                                            <svg className="role-icon" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                                                <path d="M19 15L20.09 18.26L23 19L20.09 19.74L19 23L17.91 19.74L15 19L17.91 18.26L19 15Z"/>
                                                <path d="M5 15L6.09 18.26L9 19L6.09 19.74L5 23L3.91 19.74L1 19L3.91 18.26L5 15Z"/>
                                            </svg>
                                            <div className="role-name">Seller</div>
                                            <div className="role-description">List and sell your products to buyers</div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name *</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your first name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name *</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Enter your last name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="username">Username *</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="Choose a unique username"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number *</label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password *</label>
                                    <div className="password-group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Create a strong password"
                                            required
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
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password *</label>
                                    <div className="password-group">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm your password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={toggleConfirmPasswordVisibility}
                                            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                        >
                                            {showConfirmPassword ? (
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
                            </div>

                            <div className="password-requirements">
                                <h4>Password Requirements:</h4>
                                <ul>
                                    <li>At least 8 characters long</li>
                                    <li>Contains both uppercase and lowercase letters</li>
                                    <li>Includes at least one number</li>
                                    <li>Contains at least one special character</li>
                                </ul>
                            </div>

                            <button type="submit" className="signup-btn">
                                Create Account
                            </button>

                            <div className="signin-link">
                                Already have an account? <Link to="/sign-in">Sign In</Link>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="decorative-circle circle-1"></div>
                <div className="decorative-circle circle-2"></div>
                <div className="decorative-circle circle-3"></div>
            </div>
        </>
    );
}

export default SignUp;