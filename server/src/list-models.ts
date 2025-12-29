import dotenv from 'dotenv';
const https = require('https');

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching models from:", url);

https.get(url, (res: any) => {
    let data = '';
    res.on('data', (chunk: any) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("Available models:");
                json.models.forEach((m: any) => {
                    console.log(`- ${m.name}`);
                });

                // Check specifically for user requested model
                const requested = "models/gemini-1.5-flash-latest";
                const found = json.models.find((m: any) => m.name === requested);
                if (found) {
                    console.log(`\n[SUCCESS] Found requested model: ${requested}`);
                } else {
                    console.log(`\n[WARNING] Requested model '${requested}' NOT found in list.`);
                    // Suggest alternatives
                    const flashModels = json.models.filter((m: any) => m.name.includes("flash"));
                    if (flashModels.length > 0) {
                        console.log("Alternatives containing 'flash':");
                        flashModels.forEach((m: any) => console.log(`  * ${m.name}`));
                    }
                }

            } else {
                console.log("No models property in response:", json);
            }
        } catch (e: any) {
            console.error("Error parsing JSON:", e.message);
            console.log("Raw output:", data);
        }
    });
}).on('error', (err: any) => {
    console.error("Network error:", err.message);
});
