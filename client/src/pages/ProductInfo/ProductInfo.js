import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import "./ProductInfo.css";

function ProductInfo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [error, setError] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const { isPreviousPage, isPreviousPageGroup, previousPage } = useNavigation();
    const { isLoggedIn, isBuyer, isSeller, isAdmin, user } = useAuth();
    const [seller, setSeller] = useState(null);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        fetch(`/products/${id}`)
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) {
                        throw new Error('Product not found');
                    }
                    throw new Error('Failed to fetch product');
                }
                return res.json();
            })
            .then(data => {
                setProduct(data);
            })
            .catch(error => {
                console.error('Error:', error);
                setError(error.message);
            });
        }, [id]);
        
        useEffect(() => {
        if (product && product.seller) {
            fetch(`/users/${product.seller}`)
               .then(res => res.ok ? res.json() : null)
               .then(data => setSeller(data))
               .catch(err => console.error('Error fetching seller:', err));
            }
        }, [product]);
        
    // Inicijalizacija mape
    useEffect(() => {
        if (!product || !product.location || !mapRef.current) return;

        const { latitude, longitude } = product.location;

        // Kreiranje custom ikone - roze pin sa srcem
        const heartIcon = L.divIcon({
            className: 'custom-heart-marker',
            html: `
                <div class="heart-pin">
                    <svg width="40" height="55" viewBox="0 0 40 55" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#ECC1D8;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#D889AC;stop-opacity:1" />
                            </linearGradient>
                            <filter id="shadow">
                                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
                            </filter>
                        </defs>
                        <path d="M20 52 C20 52, 5 35, 5 22 C5 10, 12 5, 20 5 C28 5, 35 10, 35 22 C35 35, 20 52, 20 52 Z" 
                              fill="url(#pinkGradient)" filter="url(#shadow)"/>
                        <path d="M20 16 C18 14, 15 14, 14 16 C13 18, 14 20, 16 22 L20 26 L24 22 C26 20, 27 18, 26 16 C25 14, 22 14, 20 16 Z" 
                              fill="white"/>
                    </svg>
                </div>
            `,
            iconSize: [40, 55],
            iconAnchor: [20, 55],
            popupAnchor: [0, -55]
        });

        // Inicijalizacija mape
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current, {
                zoomControl: true,
                scrollWheelZoom: false
            }).setView([latitude, longitude], 15);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstanceRef.current);

            // Dodavanje markera sa custom ikonom
            L.marker([latitude, longitude], { icon: heartIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                    <div style="text-align: center; padding: 5px;">
                        <strong style="color: #5D2A3D; font-size: 14px;">${product.name}</strong><br/>
                        <span style="color: #7B637B; font-size: 12px;">${product.location.address.street}</span>
                    </div>
                `);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [product]);

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? product.images.length - 1 : prev - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === product.images.length - 1 ? 0 : prev + 1
        );
    };

    // Provera da li proizvod ima slike
    const hasImages = product && product.images && product.images.length > 0;

    if (error || !product) {
        return (
            <div className="product-info-page">
                <div className="product-info-toolbar">
                    <Link to="/" className="back-link-main">← Back to Products</Link>
                </div>
                <div className="product-info-container">
                    <h2>{error || 'Product not found'}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="product-info-page">
            {isLoggedIn && isSeller && isPreviousPage('/') &&
                <div className="product-info-toolbar">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
            }
            {isLoggedIn && isSeller && (isPreviousPage('/seller/pending') || isPreviousPage('/seller/history') || isPreviousPage('/seller/for-sale')) &&
                <div className="product-info-toolbar">
                    <Link to={previousPage} className="back-link-main">← Back</Link>
                </div>
            }
            {isLoggedIn && isBuyer && isPreviousPage('/buyer/shop') &&
                <div className="product-info-toolbar">
                    <Link to="/buyer/shop" className="back-link-main">← Back to Shop</Link>
                </div>
            }
            {isLoggedIn && isBuyer && (isPreviousPageGroup('/buyer/cart') || isPreviousPageGroup('/buyer/history')) &&
                <div className="product-info-toolbar">
                    <Link to={previousPage} className="back-link-main">← Back</Link>
                </div>
            }
            {!isLoggedIn &&
                <div className="product-info-toolbar">
                    <Link to="/" className="back-link-main">← Back to Home</Link>
                </div>
            }
            {
                isLoggedIn && isPreviousPageGroup('/profile') && 
                <div className="product-info-toolbar">
                    <Link to={previousPage} className="back-link-main">← Back</Link>
                </div>
            }
            <div className="product-info-container">
                <div className="product-info-header">
                    <h1 className="product-title">{product.name}</h1>
                    <span className="product-type-badge">{product.type}</span>
                </div>

                <div className="product-info-content">
                    {/* Sekcija sa slikom */}
                    <div className="product-image-section">
                        <div className="image-carousel">
                            {!hasImages ? (
                                // Placeholder kada nema slika
                                <div className="product-image-placeholder">
                                    <div className="placeholder-icon">
                                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                        </svg>
                                    </div>
                                    <p className="placeholder-text">Image Not Available</p>
                                </div>
                            ) : (
                                // Prikazivanje slika kada postoje
                                <>
                                    {product.images.length > 1 && (
                                        <button 
                                            className="carousel-button prev"
                                            onClick={handlePrevImage}
                                            aria-label="Previous image"
                                        >
                                            ‹
                                        </button>
                                    )}
                                    <img 
                                        src={`/data/images/${product.images[currentImageIndex]}`}
                                        alt={product.name}
                                        className="product-image"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `
                                                <div class="product-image-placeholder">
                                                    <div class="placeholder-sparkles">
                                                        ${[...Array(30)].map((_, i) => 
                                                            `<div class="${i % 5 === 0 ? 'sparkle diamond' : 'sparkle'}"></div>`
                                                        ).join('')}
                                                    </div>
                                                    <div class="placeholder-icon">
                                                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                                        </svg>
                                                    </div>
                                                    <p class="placeholder-text">Image Not Available</p>
                                                </div>
                                            `;
                                        }}
                                    />
                                    {product.images.length > 1 && (
                                        <button 
                                            className="carousel-button next"
                                            onClick={handleNextImage}
                                            aria-label="Next image"
                                        >
                                            ›
                                        </button>
                                    )}
                                    {product.images.length > 1 && (
                                        <div className="carousel-indicators">
                                            {product.images.map((_, index) => (
                                                <span
                                                    key={index}
                                                    className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Seller Panel */}
                            {seller && (isBuyer || isAdmin || !isLoggedIn || (isSeller && user.id !== seller.id)) && (
                                <div className="seller-panel">
                                    <div className="seller-label">Sold by:</div>
                                    <button 
                                        className="seller-info"
                                        onClick={() => navigate(`/profile/${seller.id}`)}
                                        disabled={!isLoggedIn}
                                    >
                                        <img 
                                            src={seller.image ? `/data/images/${seller.image}` : '/data/images/default.png'}
                                            alt={seller.username}
                                            className="seller-avatar"
                                            onError={(e) => e.target.src = '/data/images/default.png'}
                                        />
                                        <span className="seller-username">@{seller.username}</span>
                                        <div className="seller-rating">
                                        <span className="rating-stars-small">★</span>
                                        <span className="rating-value">{seller.avgRating.toFixed(1)}</span>
                                    </div>
                                    </button>
                                </div>
                            )}
                            {seller && isSeller && user.id === seller.id && isPreviousPageGroup('/profile') && (
                                <div className="seller-panel">
                                    <div className="seller-label">Sold by:</div>
                                    <button 
                                        className="seller-info"
                                        onClick={() => navigate(`/profile/${seller.id}`)}
                                        disabled={true}
                                    >
                                        <img 
                                            src={seller.image ? `/data/images/${seller.image}` : '/data/images/default.png'}
                                            alt={seller.username}
                                            className="seller-avatar"
                                            onError={(e) => e.target.src = '/data/images/default.png'}
                                        />
                                        <span className="seller-username">@{seller.username}</span>
                                        <div className="seller-rating">
                                        <span className="rating-stars-small">★</span>
                                        <span className="rating-value">{seller.avgRating.toFixed(1)}</span>
                                    </div>
                                    </button>
                                </div>
                            )}
                    </div>

                    {/* Sekcija sa detaljima */}
                    <div className="product-details-section">
                        <div className="product-price">
                            <span className="price-label">Price:</span>
                            <span className="price-value">{product.price} RSD</span>
                        </div>

                        <div className="product-category">
                            <span className="category-label">Category:</span>
                            <span className="category-value">{product.category}</span>
                        </div>

                        <div className="product-date">
                            <span className="date-label">Posted on:</span>
                            <span className="date-value">{product.date}</span>
                        </div>

                        <div className="product-description">
                            <h3>Description:</h3>
                            <p>{product.description || 'No description available'}</p>
                        </div>

                        {/* Lokacija */}
                        {product.location && (
                            <div className="product-location">
                                <h3>Location:</h3>
                                <div className="location-address">
                                    <p className="address-line">{product.location.address.street}</p>
                                    <p className="address-line">{product.location.address.city}, {product.location.address.postalCode}</p>
                                </div>
                                <div className="location-map" ref={mapRef}></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="decorative-circle circle-1"></div>
            <div className="decorative-circle circle-2"></div>
        </div>
    );
}

export default ProductInfo;