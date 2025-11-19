import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import './EditProfile.css';

function EditProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const {previousPage} = useNavigation();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // General tab state
    const [generalForm, setGeneralForm] = useState({
        name: '',
        surname: '',
        birthday: '',
        description: '',
        number: '',
        image: ''
    });
    const [newImage, setNewImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Privacy tab state
    const [privacyForm, setPrivacyForm] = useState({
        currentPassword: '',
        username: '',
        mail: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // Ako nema user-a (logout scenario), odmah navigiraj bez state update-a
        if (!user) {
            navigate('/', { replace: true });
            return;
        }
        
        // Ako user pokušava da pristupi tuđem profilu
        if (parseInt(id) !== user.id) {
            navigate('/', { replace: true });
            return;
        }

        // Sve je ok, postavi form podatke
        setGeneralForm({
            name: user.name || '',
            surname: user.surname || '',
            birthday: user.birthday || '',
            description: user.description || '',
            number: user.number || '',
            image: user.image || 'default.png'
        });
        
        setPrivacyForm({
            currentPassword: '',
            username: user.username || '',
            mail: user.mail || '',
            newPassword: '',
            confirmPassword: ''
        });
        
        setImagePreview(user.image ? `/data/images/${user.image}` : '/data/images/default.png');
        setLoading(false);
    }, [user, id, navigate]);

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        setGeneralForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePrivacyChange = (e) => {
        const { name, value } = e.target;
        setPrivacyForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validacija tipa fajla
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validImageTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }
            
            // Validacija veličine fajla (maksimalno 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert('Image size must be less than 5MB');
                return;
            }
            
            setNewImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validateGeneralForm = () => {
        // Validacija imena i prezimena (samo slova, min 2 karaktera)
        const nameRegex = /^[A-Za-zÀ-ÿ\s'-]{2,}$/;
        if (!generalForm.name.trim()) {
            alert('First name is required');
            return false;
        }
        if (!nameRegex.test(generalForm.name.trim())) {
            alert('First name must contain only letters and be at least 2 characters long');
            return false;
        }
        
        if (!generalForm.surname.trim()) {
            alert('Last name is required');
            return false;
        }
        if (!nameRegex.test(generalForm.surname.trim())) {
            alert('Last name must contain only letters and be at least 2 characters long');
            return false;
        }

        // Validacija birthday formata (DD/MM/YYYY) ako je popunjeno
        if (generalForm.birthday) {
            const birthdayRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            if (!birthdayRegex.test(generalForm.birthday)) {
                alert('Birthday must be in DD/MM/YYYY format');
                return false;
            }
        }

        // Validacija broja telefona ako je popunjeno
        if (generalForm.number) {
            const phoneRegex = /^(\+381|0)?6[0-9]{7,8}$/;
            if (!phoneRegex.test(generalForm.number.replace(/[\s-]/g, ''))) {
                alert('Please enter a valid mobile number (e.g., 0638107245 or +381638107245)');
                return false;
            }
        }

        return true;
    };

    const validatePrivacyForm = () => {
        // Provera trenutne lozinke
        if (!privacyForm.currentPassword) {
            alert('Current password is required!');
            return false;
        }

        // Validacija email formata ako je promenjen
        if (privacyForm.mail !== user.mail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(privacyForm.mail)) {
                alert('Please enter a valid email address');
                return false;
            }
        }

        // Validacija username-a ako je promenjen (minimum 3 karaktera)
        if (privacyForm.username !== user.username) {
            if (privacyForm.username.length < 3) {
                alert('Username must be at least 3 characters long');
                return false;
            }
        }

        // Validacija nove lozinke ako je uneta
        if (privacyForm.newPassword) {
            // Provera da li se lozinke poklapaju
            if (privacyForm.newPassword !== privacyForm.confirmPassword) {
                alert('New passwords do not match!');
                return false;
            }

            // Provera jačine lozinke - svi kriterijumi
            if (privacyForm.newPassword.length < 8) {
                alert('Password must be at least 8 characters long');
                return false;
            }
            if (!/[a-z]/.test(privacyForm.newPassword)) {
                alert('Password must contain at least one lowercase letter');
                return false;
            }
            if (!/[A-Z]/.test(privacyForm.newPassword)) {
                alert('Password must contain at least one uppercase letter');
                return false;
            }
            if (!/\d/.test(privacyForm.newPassword)) {
                alert('Password must contain at least one number');
                return false;
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(privacyForm.newPassword)) {
                alert('Password must contain at least one special character');
                return false;
            }
        }

        return true;
    };

    const handleGeneralSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateGeneralForm()) {
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append('name', generalForm.name.trim());
            formData.append('surname', generalForm.surname.trim());
            formData.append('birthday', generalForm.birthday);
            formData.append('description', generalForm.description);
            formData.append('number', generalForm.number);
            
            if (newImage) {
                formData.append('image', newImage);
            }

            const response = await fetch(`/users/${user.id}/profile`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Failed to update profile');
            }

            const data = await response.json();
            updateUser(data.user);
            alert('Profile updated successfully!');
            setNewImage(null);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handlePrivacySubmit = async (e) => {
        e.preventDefault();
        
        if (!validatePrivacyForm()) {
            return;
        }

        setSaving(true);

        try {
            const requestBody = {
                currentPassword: privacyForm.currentPassword
            };

            if (privacyForm.username !== user.username) {
                requestBody.username = privacyForm.username;
            }

            if (privacyForm.mail !== user.mail) {
                requestBody.mail = privacyForm.mail;
            }

            if (privacyForm.newPassword) {
                requestBody.newPassword = privacyForm.newPassword;
            }

            const response = await fetch(`/users/${user.id}/credentials`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.msg || 'Failed to update credentials');
            }

            const data = await response.json();
            updateUser(data.user);
            alert('Credentials updated successfully!');
            
            setPrivacyForm(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-profile-page">
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

    return (
        <div className="edit-profile-page">
            <div className="product-info-toolbar">
                <Link to={previousPage} className="back-link-main">← Back</Link>
            </div>
            <br/>
            <br/>
            <div className="edit-profile-container">
                <div className="edit-profile-header">
                    <h1>Edit Profile</h1>
                    <p>Manage your account settings and preferences</p>
                </div>

                <div className="profile-tabs">
                    <button 
                        className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'privacy' ? 'active' : ''}`}
                        onClick={() => setActiveTab('privacy')}
                    >
                        Privacy Settings
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'general' && (
                        <form onSubmit={handleGeneralSubmit} className="edit-form">
                            <div className="form-section">
                                <h3>Profile Picture</h3>
                                <div className="image-upload-section">
                                    <div className="current-image">
                                        <img 
                                            src={imagePreview}
                                            alt="Profile"
                                            onError={(e) => e.target.src = '/data/images/default.png'}
                                        />
                                    </div>
                                    <label className="upload-image-btn">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <span>Change Photo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Personal Information</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">First Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={generalForm.name}
                                            onChange={handleGeneralChange}
                                            placeholder="Enter your first name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="surname">Last Name *</label>
                                        <input
                                            type="text"
                                            id="surname"
                                            name="surname"
                                            value={generalForm.surname}
                                            onChange={handleGeneralChange}
                                            placeholder="Enter your last name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="birthday">Birthday</label>
                                        <input
                                            type="text"
                                            id="birthday"
                                            name="birthday"
                                            value={generalForm.birthday}
                                            onChange={handleGeneralChange}
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="number">Phone Number</label>
                                        <input
                                            type="text"
                                            id="number"
                                            name="number"
                                            value={generalForm.number}
                                            onChange={handleGeneralChange}
                                            placeholder="+381..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">About Me</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={generalForm.description}
                                        onChange={handleGeneralChange}
                                        rows="4"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'privacy' && (
                        <form onSubmit={handlePrivacySubmit} className="edit-form">
                            <div className="privacy-notice">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L3 7V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V7L12 2ZM12 11H13V17H11V11ZM12 9C11.45 9 11 8.55 11 8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8C13 8.55 12.55 9 12 9Z" fill="currentColor"/>
                                </svg>
                                <p>To change your username, email, or password, you must enter your current password for security verification.</p>
                            </div>

                            <div className="form-section">
                                <h3>Account Credentials</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="currentPassword">Current Password *</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        name="currentPassword"
                                        value={privacyForm.currentPassword}
                                        onChange={handlePrivacyChange}
                                        placeholder="Enter current password"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <input
                                            type="text"
                                            id="username"
                                            name="username"
                                            value={privacyForm.username}
                                            onChange={handlePrivacyChange}
                                            placeholder="Choose a unique username"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="mail">Email</label>
                                        <input
                                            type="email"
                                            id="mail"
                                            name="mail"
                                            value={privacyForm.mail}
                                            onChange={handlePrivacyChange}
                                            placeholder="Enter your email address"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Change Password</h3>
                                <div className="password-requirements" style={{marginBottom: '1rem'}}>
                                    <h4>Password Requirements:</h4>
                                    <ul>
                                        <li>At least 8 characters long</li>
                                        <li>Contains both uppercase and lowercase letters</li>
                                        <li>Includes at least one number</li>
                                        <li>Contains at least one special character</li>
                                    </ul>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            name="newPassword"
                                            value={privacyForm.newPassword}
                                            onChange={handlePrivacyChange}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={privacyForm.confirmPassword}
                                            onChange={handlePrivacyChange}
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="save-btn"
                                disabled={saving}
                            >
                                {saving ? 'Updating...' : 'Update Credentials'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EditProfile;