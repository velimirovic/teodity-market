const express = require('express');
const router = express.Router();
const fs = require('fs');

// Email service
const emailService = require('../emailService');
const { sendReportApprovedEmail, sendReportRejectedEmail, sendAccountBlockedEmail } = emailService;

const loadReports = () => {
    const data = fs.readFileSync('data/json/reports.json');
    return JSON.parse(data);
}

const saveReports = (reports) => {
    fs.writeFileSync('data/json/reports.json', JSON.stringify(reports, null, 2));
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

// Kreiraj prijavu
router.post('/', (req, res) => {
    const reports = loadReports();
    const products = loadProducts();
    const users = loadUsers();

    const { reporterId, reportedUserId, reason } = req.body;

    // Validacija obaveznih polja
    if (!reporterId || !reportedUserId || !reason || reason.trim() === '') {
        return res.status(400).json({msg: 'Reporter, reported user and reason are required!'});
    }

    // Provera da li korisnik pokusava da prijavi samog sebe
    if (reporterId === reportedUserId) {
        return res.status(400).json({msg: 'You cannot report yourself!'});
    }

    // Provera da li korisnici postoje
    const reporter = users.find(u => u.id === reporterId && !u.blocked);
    const reportedUser = users.find(u => u.id === reportedUserId && !u.blocked);

    if (!reporter) {
        return res.status(404).json({msg: 'Reporter not found or blocked!'});
    }

    if (!reportedUser) {
        return res.status(404).json({msg: 'Reported user not found or already blocked!'});
    }

    // Provera da li postoji transakcija između ovih korisnika
    let hasTransaction = false;

    // Provera da li je reporter kupac koji je kupio od reportedUser (prodavca)
    const boughtProducts = products.filter(p => 
        !p.deleted && 
        p.status === 'Sold' && 
        p.buyer === reporterId && 
        p.seller === reportedUserId
    );

    if (boughtProducts.length > 0) {
        hasTransaction = true;
    }

    // Provera da li je reporter prodavac koji je prodao reportedUser (kupcu)
    const soldProducts = products.filter(p => 
        !p.deleted && 
        p.status === 'Sold' && 
        p.seller === reporterId && 
        p.buyer === reportedUserId
    );

    if (soldProducts.length > 0) {
        hasTransaction = true;
    }

    if (!hasTransaction) {
        return res.status(400).json({msg: 'You can only report users you had transactions with!'});
    }

    // Provera da li je već prijavio ovog korisnika
    const existingReport = reports.find(r => 
        !r.deleted && 
        r.reporterId === reporterId && 
        r.reportedUserId === reportedUserId &&
        r.status === 'Pending'
    );

    if (existingReport) {
        return res.status(400).json({msg: 'You have already reported this user! Wait for admin review.'});
    }

    // Generisanje datuma
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const newReport = {
        id: reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1,
        reporterId: reporterId,
        reportedUserId: reportedUserId,
        reason: reason.trim(),
        status: 'Pending',
        adminComment: '',
        date: `${day}/${month}/${year} ${hours}:${minutes}`,
        deleted: false
    };

    reports.push(newReport);
    saveReports(reports);

    res.status(201).json({msg: 'Report submitted successfully! Admin will review it.', report: newReport});
});

// Uzmi sve prijave (samo admin)
router.get('/', (req, res) => {
    const reports = loadReports();
    const activeReports = reports.filter(r => !r.deleted);
    res.json(activeReports);
});

// Uzmi sve pending prijave (samo admin)
router.get('/pending', (req, res) => {
    const reports = loadReports();
    const pendingReports = reports.filter(r => !r.deleted && r.status === 'Pending');
    res.json(pendingReports);
});

// Uzmi prijavu po id-u (admin)
router.get('/:id', (req, res) => {
    const reports = loadReports();
    const id = parseInt(req.params.id);
    const report = reports.find(r => r.id === id);

    if (!report || report.deleted) {
        return res.status(404).json({msg: 'Report not found!'});
    }

    res.json(report);
});

// Admin odbija prijavu
router.put('/:id/reject', async (req, res) => {
    let reports = loadReports();
    let users = loadUsers();
    const id = parseInt(req.params.id);
    const { adminComment } = req.body;

    const report = reports.find(r => r.id === id);

    if (!report || report.deleted) {
        return res.status(404).json({msg: 'Report not found!'});
    }

    if (report.status !== 'Pending') {
        return res.status(400).json({msg: 'This report has already been processed!'});
    }

    // Validacija komentara
    if (!adminComment || adminComment.trim() === '') {
        return res.status(400).json({msg: 'Admin comment is required when rejecting a report!'});
    }

    report.status = 'Rejected';
    report.adminComment = adminComment.trim();

    saveReports(reports);

    // Pošalji email reporteru
    const reporter = users.find(u => u.id === report.reporterId);
    const reportedUser = users.find(u => u.id === report.reportedUserId);
    
    if (reporter && reportedUser) {
        try {
            await sendReportRejectedEmail(reporter.mail, reportedUser.username, adminComment);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    res.json({msg: 'Report rejected successfully!', report: report});
});

// Admin prihvata prijavu
router.put('/:id/approve', async (req, res) => {
    let reports = loadReports();
    let users = loadUsers();
    let products = loadProducts();
    
    const id = parseInt(req.params.id);

    const report = reports.find(r => r.id === id);

    if (!report || report.deleted) {
        return res.status(404).json({msg: 'Report not found!'});
    }

    if (report.status !== 'Pending') {
        return res.status(400).json({msg: 'This report has already been processed!'});
    }

    // Pronađi prijavljenog korisnika
    const reportedUser = users.find(u => u.id === report.reportedUserId);

    if (!reportedUser) {
        return res.status(404).json({msg: 'Reported user not found!'});
    }

    // Blokiraj korisnika
    reportedUser.blocked = true;

    // Obriši sve proizvode prijavljenog korisnika
    products.forEach(product => {
        if (product.seller === report.reportedUserId) {
            product.deleted = true;
        }
    });

    // Ažuriraj status prijave
    report.status = 'Approved';

    saveReports(reports);
    saveUsers(users);
    saveProducts(products);

    // Pošalji email-ove
    const reporter = users.find(u => u.id === report.reporterId);
    
    try {
        await sendAccountBlockedEmail(reportedUser.mail, reportedUser.username);
        if (reporter) {
            await sendReportApprovedEmail(reporter.mail, reportedUser.username);
        }
    } catch (error) {
        console.error('Error sending email:', error);
    }

    res.json({
        msg: 'Report approved successfully! User has been blocked and their products deleted.',
        report: report
    });
});

// Obrisi prijavu (logički, samo admin)
router.delete('/:id', (req, res) => {
    let reports = loadReports();
    const id = parseInt(req.params.id);
    
    const report = reports.find(r => r.id === id);

    if (!report) {
        return res.status(404).json({msg: `No report with the id of ${id}`});
    }

    report.deleted = true;
    saveReports(reports);
    
    res.json({msg: 'Report deleted successfully!'});
});

module.exports = router;