const nodemailer = require('nodemailer');

// Konfiguriši transporter
// NAPOMENA: Ovo je primer sa Gmail-om. Za produkciju koristiti servise kao SendGrid, Mailgun itd.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Stavi svoj email
        pass: process.env.EMAIL_PASSWORD || 'your-app-password' // Gmail App Password (ne obična lozinka)
    }
});

// Provera konekcije
transporter.verify((error, success) => {
    if (error) {
        console.log('Email service error:', error);
    } else {
        console.log('Email service ready');
    }
});

// Funkcija za slanje email-a
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: to,
            subject: subject,
            text: text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Specifične email funkcije

// 1. Email kada je Fixed proizvod Sold (kupcu i prodavcu)
const sendProductSoldEmail = async (buyerEmail, sellerEmail, productName, productPrice) => {
    // Email kupcu
    const buyerSubject = 'Purchase Approved - ' + productName;
    const buyerText = `Congratulations! Your purchase request for "${productName}" has been approved by the seller. Price: ${productPrice} RSD.`;
    const buyerHtml = `
        <h2>Purchase Approved!</h2>
        <p>Congratulations! Your purchase request for <strong>"${productName}"</strong> has been approved by the seller.</p>
        <p><strong>Price:</strong> ${productPrice} RSD</p>
        <p>Please contact the seller to arrange payment and delivery.</p>
        <hr>
        <p>Thank you for using Teodity Market!</p>
    `;
    
    // Email prodavcu
    const sellerSubject = 'Product Sold - ' + productName;
    const sellerText = `Your product "${productName}" has been successfully sold! Price: ${productPrice} RSD.`;
    const sellerHtml = `
        <h2>Product Sold!</h2>
        <p>Your product <strong>"${productName}"</strong> has been successfully sold!</p>
        <p><strong>Price:</strong> ${productPrice} RSD</p>
        <p>Please contact the buyer to arrange payment and delivery.</p>
        <hr>
        <p>Thank you for using Teodity Market!</p>
    `;

    await sendEmail(buyerEmail, buyerSubject, buyerText, buyerHtml);
    await sendEmail(sellerEmail, sellerSubject, sellerText, sellerHtml);
};

// 2. Email kada kupac postavi veću ponudu na aukciji (prethodni lider)
const sendOutbidEmail = async (previousBidderEmail, productName, newBidAmount) => {
    const subject = 'You have been outbid - ' + productName;
    const text = `Someone has placed a higher bid on "${productName}". New highest bid: ${newBidAmount} RSD. Place a higher bid to stay in the auction!`;
    const html = `
        <h2>You have been outbid!</h2>
        <p>Someone has placed a higher bid on <strong>"${productName}"</strong>.</p>
        <p><strong>New highest bid:</strong> ${newBidAmount} RSD</p>
        <p>Place a higher bid to stay in the auction!</p>
        <hr>
        <p>Visit Teodity Market to place your bid now!</p>
    `;

    await sendEmail(previousBidderEmail, subject, text, html);
};

// 3. Email kada je report approved
const sendReportApprovedEmail = async (reporterEmail, reportedUsername) => {
    const subject = 'Report Approved';
    const text = `Your report against user "${reportedUsername}" has been reviewed and approved. The user has been blocked.`;
    const html = `
        <h2>Report Approved</h2>
        <p>Your report against user <strong>"${reportedUsername}"</strong> has been reviewed and approved.</p>
        <p>The user has been blocked from the platform.</p>
        <p>Thank you for helping keep Teodity Market safe!</p>
    `;

    await sendEmail(reporterEmail, subject, text, html);
};

// 4. Email kada je report rejected
const sendReportRejectedEmail = async (reporterEmail, reportedUsername, adminComment) => {
    const subject = 'Report Rejected';
    const text = `Your report against user "${reportedUsername}" has been reviewed and rejected. Reason: ${adminComment}`;
    const html = `
        <h2>Report Rejected</h2>
        <p>Your report against user <strong>"${reportedUsername}"</strong> has been reviewed and rejected.</p>
        <p><strong>Reason:</strong> ${adminComment}</p>
        <p>If you have further concerns, please contact support.</p>
    `;

    await sendEmail(reporterEmail, subject, text, html);
};

// 5. Email kada je korisnik blokiran
const sendAccountBlockedEmail = async (userEmail, username) => {
    const subject = 'Account Blocked';
    const text = `Your account "${username}" has been blocked due to violation of terms of service.`;
    const html = `
        <h2>Account Blocked</h2>
        <p>Your account <strong>"${username}"</strong> has been blocked due to violation of our terms of service.</p>
        <p>If you believe this was a mistake, please contact support.</p>
    `;

    await sendEmail(userEmail, subject, text, html);
};

// 6. Email kada je aukcija završena (pobedniku)
const sendAuctionWonEmail = async (winnerEmail, productName, finalPrice) => {
    const subject = 'Auction Won - ' + productName;
    const text = `Congratulations! You won the auction for "${productName}" with a bid of ${finalPrice} RSD.`;
    const html = `
        <h2>Congratulations! You Won the Auction!</h2>
        <p>You won the auction for <strong>"${productName}"</strong>!</p>
        <p><strong>Your winning bid:</strong> ${finalPrice} RSD</p>
        <p>Please contact the seller to arrange payment and delivery.</p>
        <hr>
        <p>Thank you for using Teodity Market!</p>
    `;

    await sendEmail(winnerEmail, subject, text, html);
};

module.exports = {
    sendEmail,
    sendProductSoldEmail,
    sendOutbidEmail,
    sendReportApprovedEmail,
    sendReportRejectedEmail,
    sendAccountBlockedEmail,
    sendAuctionWonEmail
};