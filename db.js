require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true,
        // untuk production
        ca: process.env.DB_CA_CERT
        // untuk local
        // ca: fs.readFileSync('ca.pem').toString()
    }
});

db.connect((err) => {
    if (err) throw err;
    console.log('Terhubung ke MySQL');
});

module.exports = db;
