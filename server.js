require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto-js');
const fs = require('fs');
const cors = require('cors');
const PORT = process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Ganti dengan password MySQL Anda
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync('ca.pem').toString(),
    }
});

db.connect((err) => {
    if (err) throw err;
    console.log('Terhubung ke MySQL');
});

// Endpoint login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const passwordHash = crypto.SHA256(password).toString();

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, passwordHash], (err, result) => {
        if (err) {
            console.log('Database error:', err); 
            return res.status(500).json({ success: false, message: 'Kesalahan server' });
        }
        if (result.length > 0) {
            res.json({ success: true, message: 'Login berhasil!' });
        } else {
            res.json({ success: false, message: 'Username atau password salah' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});