// /api/gemini.js
import { getApiKeys } from './config.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:streamGenerateContent';

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
        const { model, message, systemPrompt, history = [], stream = false } = await request.json();
        const apiKeys = await getApiKeys();
        const GEMINI_API_KEY = apiKeys.GEMINI_API_KEY;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        // Siapkan konten untuk Gemini API
        const contents = [];
        
        // Tambahkan system prompt sebagai user message pertama
        if (systemPrompt) {
            contents.push({
                role: "user",
                parts: [{ text: systemPrompt }]
            });
            contents.push({
                role: "model",
                parts: [{ text: "Oke, saya mengerti. Silakan ajukan pertanyaan Anda." }]
            });
        }

        // Tambahkan chat history
        history.forEach(msg => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });

        // Tambahkan message terakhir
        contents.push({
            role: "user",
            parts: [{ text: message }]
        });

        const payload = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.8
            }
        };

        if (stream) {
            // Streaming response
            return handleStreamingResponse(GEMINI_API_KEY, payload, headers);
        } else {
            // Non-streaming response
            return handleNormalResponse(GEMINI_API_KEY, payload, headers);
        }

    } catch (error) {
        console.error('Error in gemini.js:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error.message 
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}

async function handleNormalResponse(apiKey, payload, headers) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Format response untuk kompatibilitas dengan frontend
        let reply = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            reply = data.candidates[0].content.parts[0].text;
        }

        const formattedResponse = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: reply || 'Maaf, tidak ada respons yang diterima.'
                            }
                        ]
                    }
                }
            ]
        };

        return new Response(JSON.stringify(formattedResponse), {
            headers: { ...headers, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch from Gemini API',
            message: error.message
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}

async function handleStreamingResponse(apiKey, payload, headers) {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}&alt=sse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        let buffer = '';
        let fullText = '';

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body.getReader();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                
                                if (data === '[DONE]') {
                                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                    controller.close();
                                    return;
                                }

                                try {
                                    const parsed = JSON.parse(data);
                                    const text = extractTextFromGeminiStream(parsed);
                                    
                                    if (text && text !== fullText) {
                                        const newText = text.slice(fullText.length);
                                        if (newText) {
                                            fullText = text;
                                            const streamData = {
                                                choices: [
                                                    {
                                                        delta: {
                                                            content: newText
                                                        }
                                                    }
                                                ]
                                            };
                                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamData)}\n\n`));
                                        }
                                    }
                                } catch (e) {
                                    // Ignore parse errors for incomplete data
                                }
                            }
                        }
                    }

                    // Send final completion
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();

                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                ...headers,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            error: 'Failed to stream from Gemini API',
            message: error.message
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
}

function extractTextFromGeminiStream(data) {
    if (!data.candidates || !data.candidates[0]) return '';
    
    const candidate = data.candidates[0];
    
    if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        return candidate.content.parts[0].text || '';
    }
    
    return '';
                    }
