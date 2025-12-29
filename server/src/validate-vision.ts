import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables manually since we are running this script directly
dotenv.config({ path: path.join(__dirname, "../.env") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using the alias validated in previous steps
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function validateVision() {
    try {
        const imagePath = path.join(__dirname, "../../evidence/sample1.png");
        console.log(`Reading image from: ${imagePath}`);

        if (!fs.existsSync(imagePath)) {
            console.error("Error: Sample image not found at", imagePath);
            process.exit(1);
        }

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString("base64");

        const prompt = "Describe this image in detail. What do you see? If there is text, read it.";

        console.log("Sending request to Gemini...");
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/png",
                    data: base64Image
                }
            }
        ]);

        console.log("Response received!");
        console.log("------------------------------------------------");
        console.log(result.response.text());
        console.log("------------------------------------------------");
        console.log("Vision validation SUCCESS.");

    } catch (error: any) {
        console.error("Vision validation FAILED:", error);
    }
}

validateVision();
