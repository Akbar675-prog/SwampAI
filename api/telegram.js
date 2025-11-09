const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Ambil config
    const CONFIG_URL = 'https://pastebin.com/raw/ibqLac7L';
    let config;
    try {
        const configRes = await fetch(CONFIG_URL);
        config = await configRes.json();
    } catch (err) {
        return res.status(500).json({ error: 'Config load failed' });
    }

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
        res.status(500).json({ error: 'Telegram error: ' + err.message });
    }
};
