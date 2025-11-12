// /api/telegram.js
import { getApiKeys } from './config.js';

export default async function handler(request) {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        const { text, parse_mode = 'HTML' } = await request.json();
        const apiKeys = await getApiKeys();
        
        const TELEGRAM_TOKEN = apiKeys.TELEGRAM_TOKEN;
        const TELEGRAM_CHAT_ID = apiKeys.TELEGRAM_CHAT_ID;

        if (!text) {
            return new Response(JSON.stringify({ error: 'Text is required' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        // Kirim pesan ke Telegram
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: parse_mode
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Telegram API error: ${errorData.description}`);
        }

        const result = await response.json();

        return new Response(JSON.stringify({ 
            status: 'success',
            message_id: result.result.message_id
        }), {
            headers: { ...headers, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in telegram.js:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to send message to Telegram',
            message: error.message
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}
