import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CategorySelector from '../../components/CategorySelector/CategorySelector';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./ProductAdd.css";
import { useAuth } from '../../contexts/AuthContext';

function ProductAdd() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        type: '',
        location: {
            latitude: 44.0128,
            longitude: 20.9111,
            address: {
                street: '',
                city: '',
                postalCode: ''
            }
        }
    });
    
    const [images, setImages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Inicijalizacija mape
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const { latitude, longitude } = formData.location;

        const customIcon = L.divIcon({
            className: 'custom-add-marker',
            html: `
                <div class="add-heart-pin">
                    <svg width="35" height="50" viewBox="0 0 40 55" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="addPinkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#ECC1D8;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#D889AC;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <path d="M20 52 C20 52, 5 35, 5 22 C5 10, 12 5, 20 5 C28 5, 35 10, 35 22 C35 35, 20 52, 20 52 Z" 
                              fill="url(#addPinkGradient)"/>
                        <path d="M20 16 C18 14, 15 14, 14 16 C13 18, 14 20, 16 22 L20 26 L24 22 C26 20, 27 18, 26 16 C25 14, 22 14, 20 16 Z" 
                              fill="white"/>
                    </svg>
                </div>
            `,
            iconSize: [35, 50],
            iconAnchor: [17.5, 50]
        });

        setTimeout(() => {
            try {
                mapInstanceRef.current = L.map(mapRef.current, {
                    zoomControl: true,
                    scrollWheelZoom: true
                }).setView([latitude, longitude], 13);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(mapInstanceRef.current);

                markerRef.current = L.marker([latitude, longitude], { 
                    icon: customIcon,
                    draggable: true 
                }).addTo(mapInstanceRef.current);

                markerRef.current.on('dragend', async function(e) {
                    const position = e.target.getLatLng();
                    
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`
                        );
                        const data = await response.json();
                        
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                latitude: position.lat,
                                longitude: position.lng,
                                address: {
                                    street: data.address?.road || data.address?.street || '',
                                    city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '',
                                    postalCode: data.address?.postcode || ''
                                }
                            }
                        }));
                    } catch (error) {
                        console.error('Reverse geocoding failed:', error);
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                latitude: position.lat,
                                longitude: position.lng
                            }
                        }));
                    }
                });

                mapInstanceRef.current.on('click', async function(e) {
                    const position = e.latlng;
                    markerRef.current.setLatLng(position);
                    
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&addressdetails=1`
                        );
                        const data = await response.json();
                        
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                latitude: position.lat,
                                longitude: position.lng,
                                address: {
                                    street: data.address?.road || data.address?.street || '',
                                    city: data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || '',
                                    postalCode: data.address?.postcode || ''
                                }
                            }
                        }));
                    } catch (error) {
                        console.error('Reverse geocoding failed:', error);
                        setFormData(prev => ({
                            ...prev,
                            location: {
                                ...prev.location,
                                latitude: position.lat,
                                longitude: position.lng
                            }
                        }));
                    }
                });

                setTimeout(() => {
                    mapInstanceRef.current.invalidateSize();
                    setMapLoaded(true);
                }, 100);

            } catch (error) {
                console.error('Map initialization failed:', error);
            }
        }, 500);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current && formData.location) {
            const { latitude, longitude } = formData.location;
            const newPos = [latitude, longitude];
            mapInstanceRef.current.setView(newPos, 13);
            markerRef.current.setLatLng(newPos);
            
            setTimeout(() => {
                mapInstanceRef.current.invalidateSize();
            }, 100);
        }
    }, [formData.location?.latitude, formData.location?.longitude]);

    const handleSearchLocation = async () => {
        if (!searchQuery.trim()) return;
        
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Location search failed:', error);
            alert('Failed to search location');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchResult = (result) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const address = result.address || {};
        
        setFormData(prev => ({
            ...prev,
            location: {
                latitude: lat,
                longitude: lon,
                address: {
                    street: address.road || address.street || address.pedestrian || '',
                    city: address.city || address.town || address.village || address.municipality || address.county || '',
                    postalCode: address.postcode || ''
                }
            }
        }));
        
        if (markerRef.current && mapInstanceRef.current) {
            markerRef.current.setLatLng([lat, lon]);
            mapInstanceRef.current.setView([lat, lon], 15);
            
            setTimeout(() => {
                mapInstanceRef.current.invalidateSize();
            }, 100);
        }
        
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                address: {
                    ...prev.location.address,
                    [name]: value
                }
            }
        }));
    };

    const handleCategoryChange = (category) => {
        setFormData(prev => ({
            ...prev,
            category: category
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        setImages(prev => [...prev, ...files]);
    };

    const handleRemoveImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.price || !formData.category || !formData.type) {
            alert('Please fill in all required fields');
            return;
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            alert('Price must be greater than 0');
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('price', price);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('type', formData.type);
        formDataToSend.append('sellerId', user.id);
        formDataToSend.append('location', JSON.stringify(formData.location));
        
        images.forEach(image => {
            formDataToSend.append('images', image);
        });

        try {
            const res = await fetch('/products', {
                method: 'POST',
                body: formDataToSend
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.msg || 'Failed to add product');
            }

            alert('Product added successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error:', error);
            alert(`Failed to add product: ${error.message}`);
        }
    };

    return (
        <div className="product-add-page">
            <div className="add-header">
                <Link to="/" className="back-link-main">← Back to Products</Link>
            </div>

            <div className="add-container">
                <div className="add-form-wrapper">
                    <div className="form-header">
                        <div className="header-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/>
                            </svg>
                        </div>
                        <h1>Add Product</h1>
                        <p className="contact-info">teodity-market@domain.com | Novi Sad, Serbia</p>
                    </div>

                    <form onSubmit={handleSubmit} className="add-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Product Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <CategorySelector
                                    selectedCategory={formData.category}
                                    onCategoryChange={handleCategoryChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price">Price (RSD) *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="Enter price"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="type">Type *</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="Fixed">Fixed</option>
                                    <option value="Auction">Auction</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="4"
                                placeholder="Enter product description..."
                            />
                        </div>

                        {/* Images Section */}
                        <div className="images-section">
                            <label className="section-label">Product Images</label>
                            
                            {images.length > 0 && (
                                <div className="images-grid">
                                    {images.map((file, index) => (
                                        <div key={index} className="image-preview new-image">
                                            <img 
                                                src={URL.createObjectURL(file)} 
                                                alt={`Image ${index + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => handleRemoveImage(index)}
                                                title="Remove image"
                                            >
                                                ×
                                            </button>
                                            <span className="new-badge">NEW</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="upload-btn">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <span>+ Add Images</span>
                            </label>
                        </div>

                        {/* Location Section */}
                        <div className="location-section">
                            <label className="section-label">Location</label>
                            
                            <div className="location-search">
                                <input
                                    type="text"
                                    placeholder="Search location (e.g., Knez Mihailova, Beograd)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                                    className="search-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleSearchLocation}
                                    className="search-btn"
                                    disabled={isSearching}
                                >
                                    {isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="search-results">
                                    {searchResults.map((result, index) => (
                                        <div
                                            key={index}
                                            className="search-result-item"
                                            onClick={() => handleSelectSearchResult(result)}
                                        >
                                            {result.display_name}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="street">Street</label>
                                    <input
                                        type="text"
                                        id="street"
                                        name="street"
                                        value={formData.location.address.street}
                                        onChange={handleLocationInputChange}
                                        placeholder="Street address"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="city">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.location.address.city}
                                        onChange={handleLocationInputChange}
                                        placeholder="City"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="postalCode">Postal Code</label>
                                <input
                                    type="text"
                                    id="postalCode"
                                    name="postalCode"
                                    value={formData.location.address.postalCode}
                                    onChange={handleLocationInputChange}
                                    placeholder="Postal code"
                                />
                            </div>

                            <div className="map-container">
                                <p className="map-hint">Click on map or drag marker to set location</p>
                                {!mapLoaded && (
                                    <div className="map-loading">
                                        <div className="loading-spinner"></div>
                                        <p>Loading map...</p>
                                    </div>
                                )}
                                <div ref={mapRef} className="add-map" style={{ opacity: mapLoaded ? 1 : 0 }}></div>
                            </div>
                        </div>

                        <button type="submit" className="save-btn">
                            ADD PRODUCT
                        </button>
                    </form>
                </div>
            </div>

            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
        </div>
    );
}

export default ProductAdd;