import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function validate() {
    console.log("Validating with model: gemini-flash-latest");
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest"
        });

        const result = await model.generateContent("Say OK");
        const text = result.response.text();
        console.log("Response:", text);

        if (text.trim().includes("OK")) {
            console.log("Validation PASSED");
        } else {
            console.log("Validation FAILED: Unexpected output");
        }
    } catch (error: any) {
        console.error("Validation ERROR:", error.message);
    }
}

validate();
