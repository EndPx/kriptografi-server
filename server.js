require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const crypto = require('crypto-js');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

// Fungsi untuk menghasilkan token JWT
function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
}

function caesarCipher(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const isUpperCase = code >= 65 && code <= 90;
            const base = isUpperCase ? 65 : 97;
            return String.fromCharCode(((code - base + shift + 26) % 26) + base);
        }
        return char;
    }).join('');
}

// Middleware untuk memeriksa autentikasi JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ 
        success: false, 
        message: 'Token tidak ditemukan' 
    });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Endpoint login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const passwordHash = crypto.SHA256(password).toString();

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(query, [username, passwordHash], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Kesalahan server' });
        }
        if (result.length > 0) {
            const token = generateToken({ username });
            res.status(200).json({ success: true, message: 'Login berhasil!', token });
        } else {
            res.status(401).json({ success: false, message: 'Username atau password salah' });
        }
    });
});

// Endpoint register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    const passwordHash = crypto.SHA256(password).toString();

    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (checkErr, checkResult) => {
        if (checkErr) {
            return res.status(500).json({ success: false, message: 'Kesalahan server' });
        }
        if (checkResult.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah terdaftar' });
        }

        const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
        db.query(insertQuery, [username, passwordHash], (insertErr) => {
            if (insertErr) {
                return res.status(500).json({ success: false, message: 'Kesalahan server' });
            }
            res.status(201).json({ success: true, message: 'Pendaftaran berhasil!' });
        });
    });
});

// Endpoint untuk mengirim pesan
app.post('/message', authenticateToken, (req, res) => {
    const { text, username_to, aesKey, shiftCaesar } = req.body;

    // Enkripsi pesan menggunakan AES dan Caesar Cipher
    let textEncrypted = CryptoJS.AES.encrypt(text, aesKey).toString();
    textEncrypted = caesarCipher(textEncrypted, shiftCaesar);

    const id_user_by = req.user.id;

    const getUserQuery = 'SELECT id FROM users WHERE username = ?';
    db.query(getUserQuery, [username_to], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Kesalahan server' });
        }
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
        }

        const id_user_to = result[0].id;

        // Menyimpan pesan ke dalam tabel
        const insertMessageQuery = 'INSERT INTO message (text, id_user_by, id_user_to) VALUES (?, ?, ?)';
        db.query(insertMessageQuery, [textEncrypted, id_user_by, id_user_to], (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Kesalahan server saat menyimpan pesan' });
            }
            res.status(201).json({ success: true, message: 'Pesan berhasil dikirim' });
        });
    });
});



// Endpoint untuk mengambil pesan yang terenkripsi
app.get('/message', authenticateToken, (req, res) => {
    const getMessageQuery = 'SELECT message FROM messages WHERE username = ?';
    db.query(getMessageQuery, [req.user.username], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal mengambil pesan' });
        }
        
        // Dekripsi setiap pesan
        const decryptedMessages = results.map(result => {
            const bytes = crypto.AES.decrypt(result.message, JWT_SECRET);
            return bytes.toString(crypto.enc.Utf8);
        });

        res.status(200).json({ success: true, messages: decryptedMessages });
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan pada port ${PORT}`);
});
