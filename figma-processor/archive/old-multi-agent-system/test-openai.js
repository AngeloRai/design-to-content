#!/usr/bin/env node

/**
 * Simple test to check if OpenAI API is responding
 */

import "dotenv/config";

async function testOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        console.log("❌ OPENAI_API_KEY not found in environment variables");
        return false;
    }

    console.log("🔄 Testing OpenAI API connection...");

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: 'Reply with just "OK" to confirm you are working.'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            })
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            const reply = data.choices[0]?.message?.content;
            console.log(`✅ OpenAI API is working! Response: "${reply}"`);
            console.log(`💰 Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ OpenAI API error: ${response.status}`);
            console.log(`📝 Error details: ${errorText}`);

            if (response.status === 401) {
                console.log("🔑 Invalid API key - check your OPENAI_API_KEY");
            } else if (response.status === 429) {
                console.log("⏱️ Rate limit exceeded - wait and try again");
            } else if (response.status === 500 || response.status === 503) {
                console.log("🔧 OpenAI service issue - try again later");
            }

            return false;
        }
    } catch (error) {
        console.log(`❌ Network error: ${error.message}`);
        return false;
    }
}

// Also export as a module function
export async function checkOpenAIStatus() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return { working: false, error: 'No API key' };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'OK?' }],
                max_tokens: 5,
                temperature: 0
            })
        });

        return {
            working: response.ok,
            status: response.status,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            working: false,
            error: error.message
        };
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testOpenAI().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export default testOpenAI;