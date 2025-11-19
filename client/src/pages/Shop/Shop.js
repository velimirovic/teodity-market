import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import { AnimatePresence, motion } from "framer-motion";
import "../Home/Home.css"; // Koristimo isti CSS kao Home
import SearchFilterBar from "../../components/SearchFilterBar/SearchFilterBar";

function Shop() {
    const { user } = useAuth();
    const [shopProducts, setShopProducts] = useState([]);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    const fetchShopProducts = () => {
        if (!user?.id) return;
        
        fetch(`/products/shop/${user.id}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch shop products');
                }
                return res.json();
            })
            .then(products => {
                setShopProducts(products);
            })
            .catch(error => {
                console.error('Error fetching shop products:', error);
                setError('Failed to load shop products');
            });
    };

    useEffect(() => {
        fetchShopProducts();
    }, [user?.id]);

    const handleProductPurchase = () => {
        fetchShopProducts(); 
    };

    if (error) {
        return (
            <div className="home">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    const productsToShow = showAll ? shopProducts : shopProducts.slice(0, 4);
    const hasMoreProducts = shopProducts.length > 4;

    // Animacija: delay za ulaz i izlaz
    const getDelay = (idx, type) => {
        if (type === "exit" && showAll) {
            return (productsToShow.length - idx - 1) * 0.08;
        }
        return idx * 0.08;
    };

    const onMoreClick = () => {
        if (showAll) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setShowAll((prev) => !prev);
    };


    return (
        <div className="home">
            <section className="hero-section">
                <div className="hero-background">
                    <div className="bubble bubble-1"></div>
                    <div className="bubble bubble-2"></div>
                    <div className="bubble bubble-3"></div>
                    <div className="bubble bubble-4"></div>
                    <div className="bubble bubble-5"></div>
                    <div className="bubble bubble-6"></div>
                    <div className="hero-content">
                        <h5 className="hero-subtitle">Webshop</h5>
                        <h1 className="hero-title">TEODITY MARKET</h1>
                    </div>
                </div>
            </section>

            <div>
                <h1 className="hero-buyer-text">DISCOVER PRODUCTS</h1>
            </div>

            <div>
                <SearchFilterBar onFilterChange={setShopProducts}/>
            </div>

            {/* Poruka ako nema proizvoda */}
            {shopProducts.length === 0 && !error && (
                <div className="no-products-message">
                    <p>No products available for purchase at the moment.</p>
                </div>
            )}
            
            <div className="products-grid">
                {/* Animacija iz biblioteke framer-motion */}
                <AnimatePresence mode="wait">
                    {productsToShow.map((product, idx) => (
                        <motion.div
                            key={`${product.id}-shop`}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{
                                delay: getDelay(idx, "exit"),
                                duration: 0.4
                            }}
                            layout
                        >
                            <ProductCard 
                                product={product} 
                                onPurchase={handleProductPurchase}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            
            {hasMoreProducts && (
                <div className="more-section">
                    <button className="show-more-btn" onClick={onMoreClick}>
                        {showAll ? "Show Less" : "Show More"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Shop;