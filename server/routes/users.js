const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

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

const userStorage = multer.diskStorage({
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

const userUpload = multer({ 
    storage: userStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Registruj novog korisnika
router.post('/register', (req, res) => {
    const users = loadUsers();

    // Validacija obaveznih polja
    if (!req.body.name || !req.body.surname || !req.body.username || !req.body.mail || !req.body.password || !req.body.role) {
        return res.status(400).json({msg: 'All required fields must be filled!'});
    }

    // Validacija potvrde lozinke
    if (!req.body.confirmPassword || req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({msg: 'Password confirmation does not match!'});
    }

    // Administrator se ne moze registrovati - postoji samo u bazi
    if (req.body.role !== 'Buyer' && req.body.role !== 'Seller') {
        return res.status(400).json({msg: 'Role must be Buyer or Seller!'});
    }

    // Proveri jedinstvenost username-a
    if (users.find(user => user.username === req.body.username)) {
        return res.status(400).json({msg: 'Username already exists!'});
    }

    // Proveri jedinstvenost email-a  
    if (users.find(user => user.mail === req.body.mail)) {
        return res.status(400).json({msg: 'Email already exists!'});
    }

    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name: req.body.name.trim(),
        surname: req.body.surname.trim(),
        username: req.body.username.trim(),
        mail: req.body.mail.trim(),
        number: req.body.number ? req.body.number.trim() : '',
        password: req.body.password,
        birthday: req.body.birthday || '',
        image: 'default.png',
        description: req.body.description ? req.body.description.trim() : '',
        role: req.body.role,
        blocked: false,
        products: [],
        reviews: [],
        avgRating: 0.0
    };

    users.push(newUser);
    saveUsers(users);
    res.json({msg: 'User registered successfully!', user: newUser});
});

// Login korisnika
router.post('/login', (req, res) => {
    const users = loadUsers();
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({msg: 'Username and password are required!'});
    }

    // Pronadji korisnika
    const user = users.find(user => 
        user.username === username && !user.blocked
    );

    if (!user) {
        return res.status(401).json({msg: 'Invalid username!'});
    }

    // Proveri password (plain text za sada)
    if (user.password !== password) {
        return res.status(401).json({msg: 'Wrong password!'});
    }

    res.json({msg: 'Login successful!', user: user});
});

// Uzmi sve korisnike
router.get('/', (req, res) => {
    const users = loadUsers();
    const activeUsers = users.filter(user => !user.blocked);

    res.json(activeUsers);
});

// Uzmi korisnika po id-u
router.get('/:id', (req, res) => {
    const users = loadUsers();
    const id = parseInt(req.params.id);
    const user = users.find((user) => user.id === id);

    if (!user || user.blocked) {
        return res.status(404).json({msg: 'User not found!'});
    }

    res.json(user);
});

//------------------------------------------------------------------------------------------------

// Azuriraj osnovne podatke profila (birthday, image, description, number)
router.put('/:id/profile', userUpload.single('image'), (req, res) => {
    try {
        let users = loadUsers();
        const id = parseInt(req.params.id);
        const user = users.find((user) => user.id === id);
        
        if (!user || user.blocked) {
            if (req.file) {
                fs.unlinkSync(path.join('data/images', req.file.filename));
            }
            return res.status(404).json({msg: `No user with the id of ${id}`});
        }

        const oldImage = user.image;

        if (req.body.birthday !== undefined) {
            user.birthday = req.body.birthday.trim();
        }

        if (req.file) {
            user.image = req.file.filename;
            if (oldImage && oldImage !== 'default.png') {
                const oldPath = path.join('data/images', oldImage);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        if (req.body.description !== undefined) {
            user.description = req.body.description.trim();
        }

        if (req.body.number !== undefined) {
            user.number = req.body.number.trim();
        }

        if (req.body.name !== undefined) {
            user.name = req.body.name.trim();
        }

        if (req.body.surname !== undefined) {
            user.surname = req.body.surname.trim();
        }

        saveUsers(users);
        res.json({msg: 'Profile updated successfully!', user: user});
        
    } catch (error) {
        console.error('Error:', error);
        if (req.file) {
            fs.unlinkSync(path.join('data/images', req.file.filename));
        }
        res.status(500).json({msg: 'Failed to update profile'});
    }
});

// Azuriraj credentials (username, email, password) - zahteva trenutnu lozinku
router.put('/:id/credentials', (req, res) => {
    let users = loadUsers();
    const id = parseInt(req.params.id);
    const user = users.find((user) => user.id === id);
    
    if (!user || user.blocked) {
        return res.status(404).json({msg: `No user with the id of ${id}`});
    }

    // Obavezna provera trenutne lozinke
    if (!req.body.currentPassword) {
        return res.status(400).json({msg: 'Current password is required to change credentials!'});
    }

    if (user.password !== req.body.currentPassword) {
        return res.status(401).json({msg: 'Current password is incorrect!'});
    }

    // Proveri jedinstvenost username-a (ako se menja)
    if (req.body.username && req.body.username !== user.username) {
        const trimmedUsername = req.body.username.trim();
        if (users.find(u => u.username === trimmedUsername && !u.blocked && u.id !== id)) {
            return res.status(400).json({msg: 'Username already exists!'});
        }
        user.username = trimmedUsername;
    }

    // Proveri jedinstvenost email-a (ako se menja)
    if (req.body.mail && req.body.mail !== user.mail) {
        const trimmedMail = req.body.mail.trim();
        if (users.find(u => u.mail === trimmedMail && !u.blocked && u.id !== id)) {
            return res.status(400).json({msg: 'Email already exists!'});
        }
        user.mail = trimmedMail;
    }

    // Promeni lozinku (ako je prosleđena nova)
    if (req.body.newPassword) {
        if (req.body.newPassword.trim() === '') {
            return res.status(400).json({msg: 'New password cannot be empty!'});
        }
        user.password = req.body.newPassword;
    }

    saveUsers(users);
    res.json({msg: 'Credentials updated successfully!', user: user});
});

// Obrisi (blokiraj) korisnika (ADMINISTRATOR)
router.delete('/:id', (req, res) => {
    let users = loadUsers();
    let products = loadProducts();
    
    const id = parseInt(req.params.id);
    const user = users.find((user) => user.id === id);

    if (!user) {
        return res.status(404).json({msg: `No user with the id of ${id}`});
    }

    // Postavi deleted na true za sve proizvode korisnika
    products.forEach((product) => {
        if (product.seller === id) {
            product.deleted = true;
        }
    });

    user.blocked = true;
    
    saveUsers(users);
    saveProducts(products);
    
    res.json({msg: 'User blocked successfully and all products deleted!'});
});

module.exports = router;