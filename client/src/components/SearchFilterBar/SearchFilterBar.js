import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.js";
import "./SearchFilterBar.css";

function SearchFilterBar({ onFilterChange }) {
    const { user, isLoggedIn, isBuyer, isSeller } = useAuth();
    
    const [filters, setFilters] = useState({
        search: "",
        type: "",
        category: "",
        location: "",
        priceFrom: "",
        priceTo: ""
    });

    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);

    const handleClear = () => {
        const emptyFilters = {
            search: "",
            type: "",
            category: "",
            location: "",
            priceFrom: "",
            priceTo: ""
        };
        setFilters(emptyFilters);
        fetchFilteredProducts(emptyFilters);
    };

    // Učitaj SVE kategorije sa backenda
    useEffect(() => {
        fetch('/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error('Error loading categories:', err));
    }, []);

    // Učitaj SVE moguće lokacije (gradove) sa backenda
    useEffect(() => {
        fetch('/products')
            .then(res => res.json())
            .then(products => {
                const cities = [...new Set(
                    products
                        .filter(p => p.location && p.location.address && p.location.address.city)
                        .map(p => p.location.address.city)
                )].sort();
                setLocations(cities);
            })
            .catch(err => console.error('Error loading locations:', err));
    }, []);

    const handleInputChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
    };

    const handleSearch = () => {
        fetchFilteredProducts(filters);
    };

    const fetchFilteredProducts = (currentFilters) => {
        const params = new URLSearchParams();
        
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.type) params.append('type', currentFilters.type);
        if (currentFilters.category) params.append('category', currentFilters.category);
        if (currentFilters.location) params.append('city', currentFilters.location);
        if (currentFilters.priceFrom) params.append('priceFrom', currentFilters.priceFrom);
        if (currentFilters.priceTo) params.append('priceTo', currentFilters.priceTo);

        // Dinamički odabir rute na osnovu tipa korisnika
        let url;
        if (!isLoggedIn) {
            // Neregistrovan korisnik
            url = `/products/search/filter?${params.toString()}`;
        } else if (isBuyer) {
            // Buyer korisnik
            url = `/products/search/filter/buyer/${user.id}?${params.toString()}`;
        } else if (isSeller) {
            // Seller korisnik
            url = `/products/search/filter/seller/${user.id}?${params.toString()}`;
        } else {
            // Fallback za ostale slučajeve (npr. Admin)
            url = `/products/search/filter?${params.toString()}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(filteredProducts => {
                onFilterChange(filteredProducts);
            })
            .catch(err => console.error('Error filtering products:', err));
    };

    return (
        <div className="search-filter-container">
            <div className="confetti-background">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className={`confetti confetti-${i + 1}`}></div>
                ))}
            </div>
            
            <div className="search-filter-wrapper">
                <div className="search-input-container">
                    <svg 
                        className="search-icon" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        className="search-filter-input"
                        placeholder="Search..."
                        value={filters.search}
                        onChange={(e) => handleInputChange("search", e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <select
                    className="filter-select"
                    value={filters.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                >
                    <option value="" disabled hidden>Type</option>
                    <option value="Auction">Auction</option>
                    <option value="Fixed">Fixed Price</option>
                </select>

                <select
                    className="filter-select"
                    value={filters.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                >
                    <option value="" disabled hidden>Category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <select
                    className="filter-select"
                    value={filters.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                >
                    <option value="" disabled hidden>Location</option>
                    {locations.map(city => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    className="price-input"
                    placeholder="Price from"
                    value={filters.priceFrom}
                    onChange={(e) => handleInputChange("priceFrom", e.target.value)}
                />

                <input
                    type="number"
                    className="price-input"
                    placeholder="Price to"
                    value={filters.priceTo}
                    onChange={(e) => handleInputChange("priceTo", e.target.value)}
                />

                <button className="search-button" onClick={handleSearch}>
                    Search
                </button>

                <button className="clear-button" onClick={handleClear}>
                    Clear
                </button>
            </div>
        </div>
    );
}

export default SearchFilterBar;