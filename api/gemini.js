const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Ambil config dari Pastebin (sama seperti server.js)
    const CONFIG_URL = 'https://pastebin.com/raw/ibqLac7L';
    let config;
    try {
        const configRes = await fetch(CONFIG_URL);
        config = await configRes.json();
    } catch (err) {
        return res.status(500).json({ error: 'Config load failed' });
    }

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
        res.status(500).json({ error: 'Gemini error: ' + err.message });
    }
};
