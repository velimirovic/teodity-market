const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Email service
const emailService = require('../emailService');
const { sendProductSoldEmail, sendOutbidEmail, sendAuctionWonEmail } = emailService;

//-----------------------------------------------------------------------------------------

//Ucitaj prozivode
const loadProducts = () => {
    const data = fs.readFileSync('data/json/products.json');
    return JSON.parse(data);
}

//Sacuvaj proizvode
const saveProducts = (products) => {
    fs.writeFileSync('data/json/products.json', JSON.stringify(products, null, 2));
}

//Ucitaj korisnike
const loadUsers = () => {
    const data = fs.readFileSync('data/json/users.json');
    return JSON.parse(data);
}

//Sacuvaj korisnike
const saveUsers = (users) => {
    fs.writeFileSync('data/json/users.json', JSON.stringify(users, null, 2));
}

//-----------------------------------------------------------------------------------------

//Upload slika

// Multer konfiguracija
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'data/images/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

//-----------------------------------------------------------------------------------------

//Pomocne funkcije za evidentiranje otkazivanja kupovine od strane kupca

const loadCancellations = () => {
    try {
        const data = fs.readFileSync('data/json/cancellations.json');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

const saveCancellations = (cancellations) => {
    fs.writeFileSync('data/json/cancellations.json', JSON.stringify(cancellations, null, 2));
}

//-----------------------------------------------------------------------------------------


// Uzmi sve proizvode
router.get('/', (req, res) => {
    const products = loadProducts();
    // Filtriraj samo proizvode koji nisu obrisani
    const activeProducts = products.filter(product => !product.deleted);
    res.json(activeProducts);
});


// Uzmi proizvod po id-u
router.get('/:id', (req, res) => {
    const products = loadProducts();
    const id = parseInt(req.params.id);
    const product = products.find((product) => product.id === id);

    if (!product || product.deleted) {
        return res.status(404).json({msg: 'Product not found!'});
    }

    res.json(product);
});


// Dodaj proizvod
router.post('/', upload.array('images', 10), (req, res) => {
    try {
        const products = loadProducts();
        const users = loadUsers();

        // Generisanje trenutnog datuma i vremena
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // Validacija obaveznih polja
        if (!req.body.name || !req.body.price || !req.body.category || !req.body.type || !req.body.sellerId) {
            return res.status(400).json({msg: 'All required attributes (name, price, category, type, sellerId) are required!'});
        }

        // Validacija tipa
        if (req.body.type !== 'Auction' && req.body.type !== 'Fixed') {
            return res.status(400).json({msg: 'Wrong type value! Must be Auction or Fixed.'});
        }

        // Validacija cene
        const price = parseFloat(req.body.price);
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({msg: 'Price must be greater than 0!'});
        }

        // Validacija imena
        if (!req.body.name.trim() || req.body.name.trim().length < 3) {
            return res.status(400).json({msg: 'Product name must be at least 3 characters long!'});
        }

        // Parsiranje i validacija lokacije
        let location = null;
        if (req.body.location) {
            const locationData = typeof req.body.location === 'string' 
                ? JSON.parse(req.body.location) 
                : req.body.location;
            
            const { latitude, longitude, address } = locationData;
            
            if (!latitude || !longitude || !address) {
                return res.status(400).json({msg: 'Location must contain latitude, longitude and address!'});
            }

            if (!address.street || !address.city || !address.postalCode) {
                return res.status(400).json({msg: 'Address must contain street, city and postalCode!'});
            }

            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);

            if (isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({msg: 'Latitude must be a number between -90 and 90!'});
            }

            if (isNaN(lon) || lon < -180 || lon > 180) {
                return res.status(400).json({msg: 'Longitude must be a number between -180 and 180!'});
            }

            location = {
                latitude: lat,
                longitude: lon,
                address: {
                    street: address.street.trim(),
                    city: address.city.trim(),
                    postalCode: address.postalCode.trim()
                }
            };
        }

        // Obrada upload-ovanih slika
        const uploadedImages = req.files ? req.files.map(f => f.filename) : [];

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name: req.body.name.trim(),
            price: price,
            description: req.body.description ? req.body.description.trim() : '',
            category: req.body.category,
            type: req.body.type,
            date: `${day}/${month}/${year} ${hours}:${minutes}`,
            seller: parseInt(req.body.sellerId),
            images: req.body.images,
            location: location,
            offers: [],
            status: "Started",
            buyerReviewLeft: false,
            sellerReviewLeft: false,
            deleted: false
        };

        // Dodaj proizvod prodavcu
        const seller = users.find(u => u.id === parseInt(req.body.sellerId) && !u.blocked);
        if (!seller || seller.role !== 'Seller') {
            // Obriši upload-ovane slike ako prodavac nije validan
            if (req.files) {
                req.files.forEach(file => {
                    const filePath = path.join('data/images', file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                });
            }
            return res.status(400).json({msg: 'Invalid seller or seller is blocked!'});
        }

        seller.products.push(newProduct.id);

        products.push(newProduct);
        saveProducts(products);
        saveUsers(users);

        res.status(201).json({msg: 'Product added successfully!', product: newProduct});
        
    } catch (error) {
        console.error('Error adding product:', error);
        
        // Obriši upload-ovane slike ako je došlo do greške
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join('data/images', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        res.status(500).json({msg: 'Failed to add product', error: error.message});
    }
});


// Azuriraj proizvod po id-u
router.put('/:id', upload.array('images', 10), (req, res) => {
    try {
        let products = loadProducts();
        const id = parseInt(req.params.id);
        const product = products.find((product) => product.id === id);
        
        if (!product || product.deleted) {
            return res.status(404).json({msg: `No product with the id of ${id}`});
        }

        // Osnovna polja
        product.name = req.body.name ? req.body.name.trim() : product.name;
        product.price = req.body.price ? parseFloat(req.body.price) : product.price;
        product.description = req.body.description !== undefined ? req.body.description : product.description;
        product.category = req.body.category || product.category;

        // Validacija cene
        if (product.price <= 0) {
            return res.status(400).json({msg: 'Price must be greater than 0!'});
        }

        // Validacija imena
        if (!product.name || product.name.length < 3) {
            return res.status(400).json({msg: 'Product name must be at least 3 characters long!'});
        }

        // Ažuriranje slika
        const existingImages = req.body.existingImages 
            ? JSON.parse(req.body.existingImages) 
            : product.images || [];
        
        const newImages = req.files ? req.files.map(f => f.filename) : [];
        
        // Obriši slike koje su uklonjene
        const removedImages = product.images.filter(img => 
            !existingImages.includes(img) && img !== 'nophotos.jpg'
        );
        
        removedImages.forEach(img => {
            const imagePath = path.join('data/images', img);
            if (fs.existsSync(imagePath)) {
                try {
                    fs.unlinkSync(imagePath);
                    console.log(`Deleted image: ${img}`);
                } catch (err) {
                    console.error(`Failed to delete image ${img}:`, err);
                }
            }
        });
        
        // Kombinuj postojeće i nove slike
        const allImages = [...existingImages, ...newImages];
        product.images = allImages.length > 0 ? allImages : ['nophotos.jpg'];

        // Ažuriranje lokacije
        if (req.body.location) {
            const locationData = typeof req.body.location === 'string' 
                ? JSON.parse(req.body.location) 
                : req.body.location;
            
            const { latitude, longitude, address } = locationData;
            
            if (!latitude || !longitude || !address) {
                return res.status(400).json({msg: 'Location must contain latitude, longitude and address!'});
            }

            if (!address.street || !address.city || !address.postalCode) {
                return res.status(400).json({msg: 'Address must contain street, city and postalCode!'});
            }

            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);

            if (isNaN(lat) || lat < -90 || lat > 90) {
                return res.status(400).json({msg: 'Latitude must be a number between -90 and 90!'});
            }

            if (isNaN(lon) || lon < -180 || lon > 180) {
                return res.status(400).json({msg: 'Longitude must be a number between -180 and 180!'});
            }

            product.location = {
                latitude: lat,
                longitude: lon,
                address: {
                    street: address.street.trim(),
                    city: address.city.trim(),
                    postalCode: address.postalCode.trim()
                }
            };
        }

        // Validacija tipa
        if (req.body.type) {
            if (req.body.type !== 'Auction' && req.body.type !== 'Fixed') {
                return res.status(400).json({msg: 'Wrong type value!'});
            }

            // Ako je aukcija i ima ponude, ne sme se menjati tip
            if (product.type === 'Auction' && product.offers && product.offers.length > 0) {
                if (req.body.type !== 'Auction') {
                    return res.status(400).json({msg: 'Cannot change auction type when bids exist!'});
                }
            }

            product.type = req.body.type;
        }

        saveProducts(products);
        res.json({msg: 'Product updated successfully!', product: product});
        
    } catch (error) {
        console.error('Error updating product:', error);
        
        // Obriši upload-ovane slike ako je došlo do greške
        if (req.files) {
            req.files.forEach(file => {
                const filePath = path.join('data/images', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
        
        res.status(500).json({msg: 'Failed to update product', error: error.message});
    }
});


// Izbrisi proizvod po id-u
router.delete('/:id', (req, res) => {
    let products = loadProducts();
    const id = parseInt(req.params.id);
    const product = products.find((product) => product.id === id);

    if (!product) {
        return res.status(404).json({msg: `No product with the id of ${id}`});
    }

    // Logicko brisanje
    product.deleted = true;
    saveProducts(products);
    res.json({msg: 'Product deleted successfully!'});
});

//-----------------------------------------------------------------------------------------


//Kupovina proizvoda (FIXED)
router.post('/:id/purchase', (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const buyerId = req.body.buyerId;
    
    const product = products.find(p => p.id === productId && !p.deleted);
    const buyer = users.find(u => u.id === buyerId && !u.blocked);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    if (!buyer) {
        return res.status(404).json({msg: 'Buyer not found!'});
    }
    
    // Proveravam da li je proizvod FIXED
    if (product.type !== 'Fixed') {
        return res.status(400).json({msg: 'This product is not for fixed price sale!'});
    }
    
    // Proveravam da li je proizvod dostupan za kupovinu
    //ovo sam promenila, bilo je Processing
    if (product.status !== 'Started') {
        return res.status(400).json({msg: 'Product is not available for purchase!'});
    }
    
    // Postavljam kupca kao zainteresovanog za ovaj proizvod
    product.buyer = buyerId; 
    //ovo sam dodala
    product.status = 'Processing';
    // Dodajem proizvod u listu kupljenih proizvoda kupca
    buyer.products.push(productId);

    saveProducts(products);
    saveUsers(users);    
    res.json({msg: 'Purchase request sent successfully!', product: product});
});


// Kupovina proizvoda (AUCTION)
router.post('/:id/bid', async (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const { buyerId, bidAmount } = req.body;
    
    const product = products.find(p => p.id === productId && !p.deleted);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    // Proveravamo da li je proizvod AUCTION
    if (product.type !== 'Auction') {
        return res.status(400).json({msg: 'This product is not an auction!'});
    }
    
    // Proveravam da li je aukcija aktivna (Started ili Processing)
    if (product.status !== 'Started' && product.status !== 'Processing') {
        return res.status(400).json({msg: 'Auction is not active!'});
    }
    
    // Pronalazimo trenutno najvecu ponudu i prethodnog lidera
    let highestBid = product.price;
    let previousLeaderId = null;
    
    product.offers.forEach(offer => {
        if (offer.amount > highestBid) {
            highestBid = offer.amount;
            previousLeaderId = offer.buyerId;
        }
    });
    
    // Nova ponuda mora biti veća od trenutno najveće
    if (bidAmount <= highestBid) {
        return res.status(400).json({msg: 'Bid must be higher than current highest bid!'});
    }
    
    //Ako je ovo prvi offer, promeni status sa "Started" na "Processing"
    if (product.offers.length === 0 && product.status === 'Started') {
        product.status = 'Processing';
    }
    
    // Kreiramo objekat nove ponude
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newBid = {
        buyerId: buyerId,
        amount: bidAmount,
        timestamp: `${day}/${month}/${year} ${hours}:${minutes}`
    };
    
    // Dodajemo ponudu u niz ponuda 
    product.offers.push(newBid);
    
    saveProducts(products);
    
    // Pošalji email prethodnom lideru
    if (previousLeaderId && previousLeaderId !== buyerId) {
        const previousBidder = users.find(u => u.id === previousLeaderId);
        if (previousBidder) {
            try {
                await sendOutbidEmail(previousBidder.mail, product.name, bidAmount);
            } catch (error) {
                console.error('Error sending email:', error);
            }
        }
    }
    
    res.json({msg: 'Bid placed successfully!', product: product});
});


// Prodavac odobrava kupovinu (ANSWER -> APPROVE)
router.put('/:id/approve/:buyerId', async (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const buyerId = parseInt(req.params.buyerId);
    
    const product = products.find(p => p.id === productId && !p.deleted);
    
    // Osnovne provere postojanja proizvoda
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    // Proveravam da li je ovaj kupac stvarno zahtevao kupovinu ovog proizvoda 
    if (product.buyer !== buyerId) {
        return res.status(400).json({msg: 'Invalid buyer for this product!'});
    }
    
    // Moze se odobriti samo ako je status "Processing"
    if (product.status !== 'Processing') {
        return res.status(400).json({msg: 'Cannot approve - product is not in processing status!'});
    }
    
    // Odobravam prodaju
    product.status = 'Sold';
    
    saveProducts(products);
    
    // Pošalji email notifikacije
    const buyer = users.find(u => u.id === buyerId);
    const seller = users.find(u => u.id === product.seller);
    
    if (buyer && seller) {
        try {
            await sendProductSoldEmail(buyer.mail, seller.mail, product.name, product.price);
        } catch (error) {
            console.error('Error sending email:', error);
            // Email error ne treba da zaustavi proces
        }
    }
    
    res.json({msg: 'Purchase approved successfully!', product: product});
});


// Prodavac odbija kupovinu (ANSWER -> REJECT)
router.put('/:id/reject/:buyerId', (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const buyerId = parseInt(req.params.buyerId);
    const rejectionReason = req.body.reason;  // Razlog odbijanja
    
    // Validacija razloga
    if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({msg: 'Rejection reason is required!'});
    }
    
    const product = products.find(p => p.id === productId && !p.deleted);
    const buyer = users.find(u => u.id === buyerId && !u.blocked);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    // Proveravam da li je ovaj kupac zahtevao kupovinu ovog proizvoda
    if (product.buyer !== buyerId) {
        return res.status(400).json({msg: 'Invalid buyer for this product!'});
    }
    
    // Kupovina se moze odbiti samo ako je u statusu "Processing"
    if (product.status !== 'Processing') {
        return res.status(400).json({msg: 'Cannot reject - product is not in processing status!'});
    }
    
    // Odbijam prodaju
    product.status = 'Rejected';
    product.rejectionReason = rejectionReason.trim();  // Cuvam razlog odbijanja
    
    // Uklanjam proizvod iz liste kupljenih proizvoda kupca
    if (buyer) {
        buyer.products = buyer.products.filter(pid => pid !== productId);
    }
    
    saveProducts(products);
    saveUsers(users);
    
    res.json({msg: 'Purchase rejected successfully!', reason: rejectionReason});
});


//Kupac otkazuje kupovinu (CANCEL PURCHASE)
router.delete('/:id/cancel/:buyerId', (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const buyerId = parseInt(req.params.buyerId);
    
    const product = products.find(p => p.id === productId && !p.deleted);
    const buyer = users.find(u => u.id === buyerId && !u.blocked);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    // Proveravam da li ovaj kupac ima aktivnu kupovinu za ovaj proizvod
    if (product.buyer !== buyerId) {
        return res.status(400).json({msg: 'You cannot cancel this purchase!'});
    }
    
    // Kupovina se može otkazati samo dok je u statusu "Processing"
    if (product.status !== 'Processing') {
        return res.status(400).json({msg: 'Cannot cancel - purchase is not in processing status!'});
    }
    
    // Evidentiraj otkazivanje
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const cancellations = loadCancellations();
    const newCancellation = {
        id: cancellations.length > 0 ? Math.max(...cancellations.map(c => c.id)) + 1 : 1,
        buyerId: buyerId,
        productId: productId,
        productName: product.name,
        date: `${day}/${month}/${year} ${hours}:${minutes}`
    };
    
    cancellations.push(newCancellation);
    saveCancellations(cancellations);
    
    // Otkazujem kupovinu
    product.status = 'Started';
    delete product.buyer;  // Uklanjam kupca          
    
    // Uklanjam proizvod iz liste kupljenih proizvoda kupca
    if (buyer) {
        buyer.products = buyer.products.filter(pid => pid !== productId);
    }
    
    saveProducts(products);
    saveUsers(users);
    
    res.json({msg: 'Purchase cancelled successfully!'});
});

// Kupac otkazuje aukciju (CANCEL BID)
router.delete('/:id/cancel-bid/:buyerId', (req, res) => {
    let products = loadProducts();
    let cancellations = loadCancellations();
    
    const productId = parseInt(req.params.id);
    const buyerId = parseInt(req.params.buyerId);
    
    const product = products.find(p => p.id === productId && !p.deleted);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    if (product.type !== 'Auction') {
        return res.status(400).json({msg: 'This product is not an auction!'});
    }
    
    if (product.status !== 'Processing') {
        return res.status(400).json({msg: 'Cannot cancel bid - auction is not active!'});
    }
    
    // Ukloni sve bidove ovog kupca
    const initialLength = product.offers.length;
    product.offers = product.offers.filter(offer => offer.buyerId !== buyerId);
    
    if (product.offers.length === initialLength) {
        return res.status(400).json({msg: 'No bids found for this buyer!'});
    }
    
    // **NOVO: Evidentiraj otkazivanje aukcije**
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newCancellation = {
        id: cancellations.length > 0 ? Math.max(...cancellations.map(c => c.id)) + 1 : 1,
        buyerId: buyerId,
        productId: productId,
        productName: product.name,
        date: `${day}/${month}/${year} ${hours}:${minutes}`
    };
    
    cancellations.push(newCancellation);
    saveCancellations(cancellations);
    
    // Ako nema više ponuda, vrati status na "Started"
    if (product.offers.length === 0) {
        product.status = 'Started';
    }
    
    saveProducts(products);
    res.json({msg: 'Bid cancelled successfully!'});
});

//Prodavac zavrsava aukciju (END AUCTION -> APPROVE)
router.post('/:id/end-auction', async (req, res) => {
    let products = loadProducts();
    let users = loadUsers();
    
    const productId = parseInt(req.params.id);
    const sellerId = req.body.sellerId;
    
    const product = products.find(p => p.id === productId && !p.deleted);
    
    if (!product) {
        return res.status(404).json({msg: 'Product not found!'});
    }
    
    // Samo vlasnik proizvoda moze da zavrsi aukciju
    if (product.seller !== sellerId) {
        return res.status(403).json({msg: 'Only seller can end auction!'});
    }
    
    // Proveravamo da li je proizvod stvarno aukcija
    if (product.type !== 'Auction') {
        return res.status(400).json({msg: 'This product is not an auction!'});
    }
    
    // Aukcija mora biti aktivna da bi mogla da se zavrsi
    if (product.status !== 'Processing') {
        return res.status(400).json({msg: 'Auction is not active!'});
    }
    
    // Mora postojati bar jedna ponuda da bi se aukcija završila
    if (product.offers.length === 0) {
        return res.status(400).json({msg: 'Cannot end auction - no bids placed!'});
    }
    
    // Pronalazim najvecu ponudu
    const winningBid = product.offers.reduce((prev, current) => 
        (prev.amount > current.amount) ? prev : current
    );
    
    // Pronalazim kupca koji je postavio tu ponudu
    const winner = users.find(u => u.id === winningBid.buyerId);
    
    if (!winner) {
        return res.status(404).json({msg: 'Winning buyer not found!'});
    }
    
    // Pronalazim prodavca
    const seller = users.find(u => u.id === product.seller);
    
    // Zavrsavam aukciju
    product.status = 'Sold';                   
    product.buyer = winningBid.buyerId;        
    product.finalPrice = winningBid.amount;    
    
    // Dodajemo proizvod u listu kupljenih proizvoda pobednika aukcije
    winner.products.push(productId);
    
    saveProducts(products);
    saveUsers(users);
    
    // Pošalji email pobedniku i prodavcu
    try {
        await sendAuctionWonEmail(winner.mail, product.name, winningBid.amount);
        
        // Email prodavcu
        if (seller) {
            await sendProductSoldEmail(winner.mail, seller.mail, product.name, winningBid.amount);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }
    
    // Vracam informacije o pobedniku i konacnoj ceni
    res.json({
        msg: 'Auction ended successfully!', 
        winner: winner.username,           
        finalPrice: winningBid.amount,     
        product: product                   
    });
});

//-----------------------------------------------------------------------------------------

// Proizvodi na prodaju od prodavca - For Sale stranica
router.get('/for-seller/:sellerId', (req, res) => {
    const products = loadProducts();
    const sellerId = parseInt(req.params.sellerId);
    
    const sellerProducts = products.filter(product => 
        !product.deleted && 
        product.seller === sellerId && 
        ((product.type === 'Fixed' && product.status === 'Started') ||
         (product.type === 'Auction' && (product.status === 'Started')))
    );
    
    res.json(sellerProducts);
});

// Proizvodi koji cekaju na odgovor od prodavca - To Be Marked stranica
router.get('/to-be-marked/:sellerId', (req, res) => {
    const products = loadProducts();
    const sellerId = parseInt(req.params.sellerId);
    
    const pendingProducts = products.filter(product => 
        !product.deleted && 
        product.seller === sellerId && 
        product.status === 'Processing' &&
        ((product.type === 'Fixed' && product.buyer) || // Fixed sa buyer
         (product.type === 'Auction' && product.offers && product.offers.length > 0)) // Auction sa ponudama
    );
    
    res.json(pendingProducts);
});

// Proizvodi koje je prodavac odbio ili prodao - Transaction History stranica
router.get('/seller-history/:sellerId', (req, res) => {
    const products = loadProducts();
    const sellerId = parseInt(req.params.sellerId);
    
    const historyProducts = products.filter(product => 
        !product.deleted && 
        product.seller === sellerId && 
        (product.status === 'Sold' || product.status === 'Rejected')
    );
    
    res.json(historyProducts);
});

// Proizvodi za shop kupca - Shop stranica
router.get('/shop/:buyerId', (req, res) => {
    const products = loadProducts();
    const buyerId = parseInt(req.params.buyerId);
    
    const shopProducts = products.filter(product => 
        !product.deleted && 
        product.seller !== buyerId && // ne prikazuj svoje proizvode
        ((product.type === 'Fixed' && product.status === 'Started') ||
         (product.type === 'Auction' && product.status === 'Started') ||
         (product.type === 'Auction' && product.status === 'Processing' &&
           (!product.offers || product.offers.length === 0 || // nema ponuda uopste
            product.offers[product.offers.length - 1].buyerId !== buyerId))) // ili nije poslednji koji je licitirao
    );
    
    res.json(shopProducts);
});

// Proizvodi koje kupac ima u proccessingu - Cart stranica
router.get('/cart/:buyerId', (req, res) => {
    const products = loadProducts();
    const buyerId = parseInt(req.params.buyerId);
    
    const cartProducts = products.filter(product => 
        !product.deleted && 
        product.status === 'Processing' && 
        ((product.type === 'Fixed' && product.buyer === buyerId) ||
         (product.type === 'Auction' && product.offers.some(offer => offer.buyerId === buyerId)))
    );
    
    res.json(cartProducts);
});

// Proizvodi koje je kupac kupio ili bio odbijen prilikom kupovine - Purchase History stranica
router.get('/purchase-history/:buyerId', (req, res) => {
    const products = loadProducts();
    const buyerId = parseInt(req.params.buyerId);
    
    const historyProducts = products.filter(product => 
        !product.deleted && 
        ((product.buyer === buyerId && (product.status === 'Sold' || product.status === 'Rejected')) ||
         (product.type === 'Auction' && product.status === 'Sold' && 
          product.offers.some(offer => offer.buyerId === buyerId)))
    );
    
    res.json(historyProducts);
});

//-----------------------------------------------------------------------------------------

// Pretraga i filtriranje proizvoda za izlogovanog korisnika
router.get('/search/filter', (req, res) => {
    const products = loadProducts();
    let filteredProducts = products.filter(p => !p.deleted && 
        ((p.type === 'Fixed' && p.status === 'Started') ||
         (p.type === 'Auction' && p.status === 'Started') ||
         (p.type === 'Auction' && p.status === 'Processing')));

    // Search po nazivu i opisu
    if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    // Filter po ceni (od)
    if (req.query.priceFrom) {
        const priceFrom = parseFloat(req.query.priceFrom);
        filteredProducts = filteredProducts.filter(p => p.price >= priceFrom);
    }

    // Filter po ceni (do)
    if (req.query.priceTo) {
        const priceTo = parseFloat(req.query.priceTo);
        filteredProducts = filteredProducts.filter(p => p.price <= priceTo);
    }

    // Filter po tipu (Auction/Fixed)
    if (req.query.type) {
        filteredProducts = filteredProducts.filter(p => p.type === req.query.type);
    }

    // Filter po kategoriji
    if (req.query.category) {
        filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
    }

    // Filter po lokaciji (grad)
    if (req.query.city) {
        const city = req.query.city.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.location && p.location.address.city.toLowerCase().includes(city)
        );
    }

    res.json(filteredProducts);
});

// Pretraga i filtriranje proizvoda za BUYERA
router.get('/search/filter/buyer/:buyerId', (req, res) => {
    const products = loadProducts();
    const buyerId = parseInt(req.params.buyerId);

    let filteredProducts = products.filter(p => !p.deleted && 
        ((p.type === 'Fixed' && p.status === 'Started') ||
         (p.type === 'Auction' && p.status === 'Started') ||
         (p.type === 'Auction' && p.status === 'Processing' && (!p.offers || p.offers.length === 0 || p.offers[p.offers.length - 1].buyerId !== buyerId))));

    // Search po nazivu i opisu
    if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    // Filter po ceni (od)
    if (req.query.priceFrom) {
        const priceFrom = parseFloat(req.query.priceFrom);
        filteredProducts = filteredProducts.filter(p => p.price >= priceFrom);
    }

    // Filter po ceni (do)
    if (req.query.priceTo) {
        const priceTo = parseFloat(req.query.priceTo);
        filteredProducts = filteredProducts.filter(p => p.price <= priceTo);
    }

    // Filter po tipu (Auction/Fixed)
    if (req.query.type) {
        filteredProducts = filteredProducts.filter(p => p.type === req.query.type);
    }

    // Filter po kategoriji
    if (req.query.category) {
        filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
    }

    // Filter po lokaciji (grad)
    if (req.query.city) {
        const city = req.query.city.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.location && p.location.address.city.toLowerCase().includes(city)
        );
    }

    res.json(filteredProducts);
});

// Pretraga i filtriranje proizvoda za SELLERA
router.get('/search/filter/seller/:sellerId', (req, res) => {
    const products = loadProducts();
    const sellerId = parseInt(req.params.sellerId);

    let filteredProducts = products.filter(p => !p.deleted && p.seller === sellerId);

    // Search po nazivu i opisu
    if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    // Filter po ceni (od)
    if (req.query.priceFrom) {
        const priceFrom = parseFloat(req.query.priceFrom);
        filteredProducts = filteredProducts.filter(p => p.price >= priceFrom);
    }

    // Filter po ceni (do)
    if (req.query.priceTo) {
        const priceTo = parseFloat(req.query.priceTo);
        filteredProducts = filteredProducts.filter(p => p.price <= priceTo);
    }

    // Filter po tipu (Auction/Fixed)
    if (req.query.type) {
        filteredProducts = filteredProducts.filter(p => p.type === req.query.type);
    }

    // Filter po kategoriji
    if (req.query.category) {
        filteredProducts = filteredProducts.filter(p => p.category === req.query.category);
    }

    // Filter po lokaciji (grad)
    if (req.query.city) {
        const city = req.query.city.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
            p.location && p.location.address.city.toLowerCase().includes(city)
        );
    }

    res.json(filteredProducts);
});

module.exports = router;