const express = require('express');
const app = express();
const path = require('path');

require('dotenv').config();

app.use(express.json());
app.use('/data/images', express.static(path.join(__dirname, 'data/images')));
app.use(express.urlencoded({ extended: true }));

const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/reviews');
const reportsRoutes = require('./routes/reports');
const suspiciousUsersRoutes = require('./routes/suspiciousUsers');

app.use('/products', productsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/users/suspicious', suspiciousUsersRoutes);
app.use('/users', usersRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/reports', reportsRoutes);

app.listen(5000, () => {
    console.log("Server running on 5000..")
});