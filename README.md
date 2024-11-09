# kriptografi-server

Proyek ini menyediakan layanan backend untuk otentikasi pengguna dengan menggunakan database MySQL. Server dibangun menggunakan Node.js dengan Express, MySQL, dan CryptoJS untuk penanganan kata sandi yang aman.

## Endpoints

### POST `/login`

Endpoint ini digunakan untuk login pengguna. Endpoint ini menerima `username` dan `password` sebagai parameter dalam body permintaan, kemudian memeriksa kredensial tersebut di database.

#### Permintaan

- **Metode**: `POST`
- **URL**: `/login`

**Body Permintaan** (JSON):
```json
{
    "username": "example_username",
    "password": "example_password"
}
