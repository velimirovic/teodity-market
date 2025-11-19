const express = require('express');
const router = express.Router();
const fs = require('fs');

const loadCategories = () => {
    const data = fs.readFileSync('data/json/categories.json');
    return JSON.parse(data);
}

const saveCategories = (categories) => {
    fs.writeFileSync('data/json/categories.json', JSON.stringify(categories, null, 2));
}

// Uzmi sve kategorije
router.get('/', (req, res) => {
    const categories = loadCategories();
    res.json(categories);
});

// Uzmi kategoriju po id-u
router.get('/:id', (req, res) => {
    const categories = loadCategories();
    const id = parseInt(req.params.id);
    const category = categories.find((category) => category.id === id);

    if (!category) {
        return res.status(404).json({msg: 'Category not found!'});
    }

    res.json(category);
});

// Dodaj kategoriju
router.post('/', (req, res) => {
    const categories = loadCategories();
    
    // Validacija
    if (!req.body.name || req.body.name.trim() === '') {
        return res.status(400).json({msg: 'Category name is required'});
    }
    
    // Proveri da li kategorija sa ovim imenom vec postoji
    const existingCategory = categories.find(c => c.name.toLowerCase() === req.body.name.trim().toLowerCase());
    if (existingCategory) {
        return res.status(400).json({msg: 'Category with this name already exists'});
    }

    const newCategory = {
        id: categories.length + 1,
        name: req.body.name.trim(),
        deleted: false
    };

    categories.push(newCategory);
    saveCategories(categories);
    res.json(newCategory);
});

module.exports = router;
