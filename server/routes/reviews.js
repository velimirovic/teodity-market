const express = require('express');
const router = express.Router();
const fs = require('fs');

const loadReviews = () => {
    const data = fs.readFileSync('data/json/reviews.json');
    return JSON.parse(data);
}

const saveReviews = (reviews) => {
    fs.writeFileSync('data/json/reviews.json', JSON.stringify(reviews, null, 2));
}

const loadProducts = () => {
    const data = fs.readFileSync('data/json/products.json');
    return JSON.parse(data);
}

const saveProducts = (products) => {
    fs.writeFileSync('data/json/products.json', JSON.stringify(products, null, 2));
}

const loadUsers = () => {
    const data = fs.readFileSync('data/json/users.json');
    return JSON.parse(data);
}

const saveUsers = (users) => {
    fs.writeFileSync('data/json/users.json', JSON.stringify(users, null, 2));
}

// Kreiraj review
router.post('/', (req, res) => {
    const reviews = loadReviews();
    const products = loadProducts();
    const users = loadUsers();

    const { reviewerId, reviewedUserId, grade, comment } = req.body;

    // Validacija obaveznih polja
    if (!reviewerId || !reviewedUserId || !grade) {
        return res.status(400).json({msg: 'Reviewer, reviewed user and grade are required!'});
    }

    // Provera da li korisnik pokušava da oceni samog sebe
    if (reviewerId === reviewedUserId) {
        return res.status(400).json({msg: 'You cannot review yourself!'});
    }

    // Provera da li korisnici postoje
    const reviewer = users.find(u => u.id === reviewerId && !u.blocked);
    const reviewedUser = users.find(u => u.id === reviewedUserId && !u.blocked);

    if (!reviewer || !reviewedUser) {
        return res.status(404).json({msg: 'User not found or blocked!'});
    }

    // Validacija ocene (1-5)
    if (grade < 1 || grade > 5) {
        return res.status(400).json({msg: 'Grade must be between 1 and 5!'});
    }

    // Provera da li postoji sold transakcija između ovih korisnika
    let hasTransaction = false;
    let transactionType = null; // 'buyer' ili 'seller'

    // Provera da li je reviewer kupac koji je kupio od reviewedUser (prodavca)
    const boughtProducts = products.filter(p => 
        !p.deleted && 
        p.status === 'Sold' && 
        p.buyer === reviewerId && 
        p.seller === reviewedUserId
    );

    if (boughtProducts.length > 0) {
        hasTransaction = true;
        transactionType = 'buyer'; // reviewer je kupac
    }

    // Provera da li je reviewer prodavac koji je prodao reviewedUser (kupcu)
    const soldProducts = products.filter(p => 
        !p.deleted && 
        p.status === 'Sold' && 
        p.seller === reviewerId && 
        p.buyer === reviewedUserId
    );

    if (soldProducts.length > 0) {
        hasTransaction = true;
        transactionType = 'seller'; // reviewer je prodavac
    }

    if (!hasTransaction) {
        return res.status(400).json({msg: 'You can only review users you had successful transactions with!'});
    }

    // Provera da li je već ostavio review
    const existingReview = reviews.find(r => 
        !r.deleted && 
        r.reviewerId === reviewerId && 
        r.reviewedUserId === reviewedUserId
    );

    if (existingReview) {
        return res.status(400).json({msg: 'You have already reviewed this user!'});
    }

    // Generisanje datuma
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newReview = {
        id: reviews.length > 0 ? Math.max(...reviews.map(r => r.id)) + 1 : 1,
        reviewerId: reviewerId,
        reviewedUserId: reviewedUserId,
        grade: grade,
        comment: comment || '',
        date: `${day}/${month}/${year} ${hours}:${minutes}`,
        deleted: false
    };

    reviews.push(newReview);
    
    // Dodaj review u listu reviews ocenjenog korisnika
    reviewedUser.reviews.push(newReview.id);
    
    // Preračunaj prosečnu ocenu
    const userReviews = reviews.filter(r => 
        !r.deleted && 
        r.reviewedUserId === reviewedUserId
    );
    const avgRating = userReviews.reduce((sum, r) => sum + r.grade, 0) / userReviews.length;
    reviewedUser.avgRating = Math.round(avgRating * 10) / 10; // Zaokruži na 1 decimalu

    saveReviews(reviews);
    saveUsers(users);

    res.status(201).json({msg: 'Review created successfully!', review: newReview});
});

// Uzmi sve reviews (ADMINISTRATOR)
router.get('/', (req, res) => {
    const reviews = loadReviews();
    const activeReviews = reviews.filter(r => !r.deleted);
    res.json(activeReviews);
});

// Uzmi sve reviews za određenog korisnika 
router.get('/user/:userId', (req, res) => {
    const reviews = loadReviews();
    const users = loadUsers();
    const userId = parseInt(req.params.userId);

    const user = users.find(u => u.id === userId && !u.blocked);
    if (!user) {
        return res.status(404).json({msg: 'User not found!'});
    }

    // Samo reviews koji nisu obrisani
    const userReviews = reviews.filter(r => 
        !r.deleted && 
        r.reviewedUserId === userId
    );

    res.json(userReviews);
});

// Uzmi reviews koje je korisnik ostavio drugima 
router.get('/by-user/:userId', (req, res) => {
    const reviews = loadReviews();
    const userId = parseInt(req.params.userId);

    const userReviews = reviews.filter(r => 
        !r.deleted && 
        r.reviewerId === userId
    );

    res.json(userReviews);
});

// Izmeni review (samo admin)
router.put('/:id', (req, res) => {
    let reviews = loadReviews();
    let users = loadUsers();
    const id = parseInt(req.params.id);
    
    const review = reviews.find(r => r.id === id);
    
    if (!review || review.deleted) {
        return res.status(404).json({msg: `No review with the id of ${id}`});
    }

    // Stari podaci za preračunavanje
    const oldGrade = review.grade;
    const reviewedUserId = review.reviewedUserId;

    // Izmena
    review.grade = req.body.grade || review.grade;
    review.comment = req.body.comment !== undefined ? req.body.comment : review.comment;

    // Validacija ocene
    if (review.grade < 1 || review.grade > 5) {
        return res.status(400).json({msg: 'Grade must be between 1 and 5!'});
    }

    // Ako se promenila ocena, preračunaj avgRating
    if (oldGrade !== review.grade) {
        const reviewedUser = users.find(u => u.id === reviewedUserId);
        if (reviewedUser) {
            const userReviews = reviews.filter(r => 
                !r.deleted && 
                r.reviewedUserId === reviewedUserId
            );
            const avgRating = userReviews.reduce((sum, r) => sum + r.grade, 0) / userReviews.length;
            reviewedUser.avgRating = Math.round(avgRating * 10) / 10;
            saveUsers(users);
        }
    }

    saveReviews(reviews);
    res.json({msg: 'Review updated successfully!', review: review});
});

// Obrisi review (logicki, ADMINISTRATOR)
router.delete('/:id', (req, res) => {
    let reviews = loadReviews();
    let users = loadUsers();
    const id = parseInt(req.params.id);
    
    const review = reviews.find(r => r.id === id);

    if (!review) {
        return res.status(404).json({msg: `No review with the id of ${id}`});
    }

    review.deleted = true;

    // Ukloni review iz liste korisnika
    const reviewedUser = users.find(u => u.id === review.reviewedUserId);
    if (reviewedUser) {
        reviewedUser.reviews = reviewedUser.reviews.filter(rid => rid !== id);
        
        // Preračunaj prosečnu ocenu
        const userReviews = reviews.filter(r => 
            !r.deleted && 
            r.reviewedUserId === review.reviewedUserId
        );
        
        if (userReviews.length > 0) {
            const avgRating = userReviews.reduce((sum, r) => sum + r.grade, 0) / userReviews.length;
            reviewedUser.avgRating = Math.round(avgRating * 10) / 10;
        } else {
            reviewedUser.avgRating = 0;
        }
        
        saveUsers(users);
    }

    saveReviews(reviews);
    res.json({msg: 'Review deleted successfully!'});
});

module.exports = router;