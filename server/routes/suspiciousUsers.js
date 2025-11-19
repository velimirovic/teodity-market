const express = require('express');
const router = express.Router();
const fs = require('fs');

const loadCancellations = () => {
    try {
        const data = fs.readFileSync('data/json/cancellations.json');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

const loadUsers = () => {
    const data = fs.readFileSync('data/json/users.json');
    return JSON.parse(data);
}

// Dobavi sve sumnjive korisnike (više od 5 otkazivanja u poslednjih 30 dana)
router.get('/', (req, res) => {
    const cancellations = loadCancellations();
    const users = loadUsers();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Grupiši otkazivanja po korisnicima
    const userCancellations = {};
    
    cancellations.forEach(cancellation => {
        // Parsiraj datum (format: "DD/MM/YYYY HH:MM")
        const [datePart] = cancellation.date.split(' ');
        const [day, month, year] = datePart.split('/');
        const cancellationDate = new Date(`${year}-${month}-${day}`);
        
        // Samo otkazivanja u poslednjih 30 dana
        if (cancellationDate >= thirtyDaysAgo) {
            if (!userCancellations[cancellation.buyerId]) {
                userCancellations[cancellation.buyerId] = [];
            }
            userCancellations[cancellation.buyerId].push(cancellation);
        }
    });

    // Filtriraj korisnike sa više od 5 otkazivanja
    const suspiciousUsers = [];
    
    Object.keys(userCancellations).forEach(buyerId => {
        const count = userCancellations[buyerId].length;
        if (count > 5) {
            const user = users.find(u => u.id === parseInt(buyerId) && !u.blocked);
            if (user) {
                suspiciousUsers.push({
                    ...user,
                    cancellationCount: count,
                    recentCancellations: userCancellations[buyerId]
                });
            }
        }
    });

    res.json(suspiciousUsers);
});

module.exports = router;