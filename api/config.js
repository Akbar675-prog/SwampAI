// /api/config.js
let API_KEYS = null;
let lastFetch = 0;

export async function getApiKeys() {
    // Cache untuk 5 menit
    if (API_KEYS && Date.now() - lastFetch < 300000) {
        return API_KEYS;
    }

    try {
        const response = await fetch('https://pastebin.com/raw/ibqLac7L');
        if (!response.ok) throw new Error('Failed to fetch API keys');
        
        API_KEYS = await response.json();
        lastFetch = Date.now();
        return API_KEYS;
    } catch (error) {
        console.error('Error fetching API keys:', error);
        // Fallback keys jika gagal fetch
        return {
            GEMINI_API_KEY: "AIzaSyDCigG9d33FQMllvx2RYVe9mGJbLkANSQU",
            TELEGRAM_TOKEN: "8524645623:AAFyGDE4WgyGbN28yCEsr1naVVpPslEblUA",
            TELEGRAM_CHAT_ID: "7706220321"
        };
    }
}
