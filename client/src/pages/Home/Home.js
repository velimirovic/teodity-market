import ProductCard from "../../components/ProductCard/ProductCard";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext"; 
import "./Home.css";
import SearchFilterBar from "../../components/SearchFilterBar/SearchFilterBar";

function Home() {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const { user, isLoggedIn, isSeller, isBuyer } = useAuth(); 
    
    const fetchProducts = () => {
        fetch('/products')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch products');
                }
                return res.json();
            })
            .then(data => {
                // Filtriraj proizvode za Seller korisnike
                if (isSeller && user && user.products) {
                    const userProducts = data.filter(product => user.products.includes(product.id));
                    setProducts(userProducts);
                }
                else if(!isLoggedIn) {
                    const availableProducts = data.filter(product => product.status =='Started' || (product.status==='Processing' && product.type === 'Auction'))
                    setProducts(availableProducts)
                }
                else {
                    const availableProducts = data.filter(product => product.status !== 'Processing');
                    setProducts(availableProducts);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                setError('Failed to load products');
            });
    };

    useEffect(() => {
        fetchProducts();
    }, [isSeller, user]);

    const handleProductDelete = (deletedId) => {
        setProducts(prevProducts => prevProducts.filter(product => product.id !== deletedId));
    };

    if (error) {
        return (
            <div className="home">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    const productsToShow = showAll ? products : products.slice(0, 4);
    const hasMoreProducts = products.length > 4;

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

    const handleProductPurchase = (productId) => {
        fetchProducts();
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
                        <h5 className="hero-subtitle">WEBSHOP</h5>
                        <h1 className="hero-title">TEODITY MARKET</h1>
                    </div>
                </div>
            </section>

            {isSeller && 
            <div>
                <h1 className="hero-seller-text">MY PRODUCTS</h1>
            </div>
            }

            <div className="search-filter-section">
                <SearchFilterBar onFilterChange={setProducts} />
            </div>

            {/* Prikazi poruku ako Seller nema proizvode */}
            {isSeller && products.length === 0 && !error && (
                <div className="no-products-message">
                    <p>YOU HAVEN'T ADDED ANY PRODUCTS YET.</p>
                </div>
            )}

            {/* Poruka ako nema proizvoda */}
            {!isLoggedIn && productsToShow.length === 0 && !error && (
                <div className="no-products-message">
                    <p>No products available for purchase at the moment.</p>
                </div>
            )}

            <div className="products-grid">
                {/* Animacija iz biblioteke framer-motion */}
                <AnimatePresence mode="wait">
                    {productsToShow.map((product, idx) => (
                        <motion.div
                            key={`${product.id}-${isSeller ? 'seller' : 'all'}`}
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
                                onDelete={handleProductDelete}
                                onPurchase={handleProductPurchase}
                                isLoggedIn={isLoggedIn}
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

export default Home;