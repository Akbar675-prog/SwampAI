// server.js - Ambil key dari URL JSON
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.static(__dirname));
app.use(cors());
app.use(express.json());

// URL JSON kamu (ganti dengan punya kamu)
const CONFIG_URL = 'https://pastebin.com/raw/ibqLac7L';

let config = null;

// Ambil config saat server mulai
async function loadConfig() {
    try {
        const res = await fetch(CONFIG_URL);
        config = await res.json();
        console.log('Config berhasil dimuat dari URL');
    } catch (err) {
        console.error('Gagal ambil config:', err.message);
        process.exit(1);
    }
}

// API Gemini
app.post('/api/gemini', async (req, res) => {
    if (!config) return res.status(500).json({ error: 'Config belum siap' });

    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Gemini error' });
    }
});

// API Telegram
app.post('/api/telegram', async (req, res) => {
    if (!config) return res.status(500).json({ error: 'Config belum siap' });

    const TELEGRAM_API = `https://api.telegram.org/bot${config.TELEGRAM_TOKEN}/sendMessage`;
    try {
        await fetch(TELEGRAM_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.TELEGRAM_CHAT_ID,
                text: req.body.text,
                parse_mode: req.body.parse_mode || 'Markdown'
            })
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Telegram error' });
    }
});

// Mulai server
const PORT = 3000;
loadConfig().then(() => {
    app.listen(PORT, () => {
        console.log('Server JALAN!');
        console.log('Buka: http://localhost:3000/tools/chatbot.html');
    });
});
module.exports = app;
