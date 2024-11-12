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
            return res.status(500).json({
                success: false,
                message: 'Kesalahan server',
                status: 'error'
            });
        }
        if (result.length > 0) {
            res.status(200).json({
                success: true,
                message: 'Login berhasil!',
                status: 'success'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Username atau password salah',
                status: 'failed'
            });
        }
    });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const passwordHash = crypto.SHA256(password).toString();

    // Query untuk memeriksa apakah username sudah ada
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, res) => {
        if (checkErr) {
            return res.status(500).json({
                success: false,
                message: 'Kesalahan server saat memeriksa username',
                status: 'error'
            });
        }

        // Jika username sudah ada
        if (res.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username sudah terdaftar',
                status: 'failed'
            });
        }

        // Jika username belum ada, lanjutkan proses pendaftaran
        const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(insertQuery, [username, passwordHash], (err, res) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Kesalahan server saat mendaftar',
                    status: 'error'
                });
            }

            if (res.affectedRows > 0) {
                res.status(201).json({
                    success: true,
                    message: 'Pendaftaran berhasil!',
                    status: 'success'
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Pendaftaran gagal',
                    status: 'failed'
                });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});