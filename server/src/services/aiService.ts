import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY not found");

console.log(`[DEBUG] Initializing Gemini with Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-flash-latest (matches 1.5 Flash capabilities) as gemini-1.5-flash-latest 
// returned 404 for this API key. Validation passed with this alias.
const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
        responseMimeType: "application/json",
    }
});

// Schema definition
const timelineSchema = {
    description: "Timeline of events extracted from evidence",
    type: SchemaType.OBJECT,
    properties: {
        events: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    timestamp: { type: SchemaType.STRING, description: "ISO 8601 timestamp" },
                    confidence: { type: SchemaType.NUMBER, description: "Confidence score 0.0-1.0" },
                    description: { type: SchemaType.STRING, description: "Event description" },
                    explanation: { type: SchemaType.STRING, description: "Reasoning for the inference" },
                    source_file: { type: SchemaType.STRING, description: "Filename of the source evidence" }
                },
                required: ["timestamp", "confidence", "description", "explanation", "source_file"]
            }
        },
        relations: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    from_event_index: { type: SchemaType.NUMBER },
                    to_event_index: { type: SchemaType.NUMBER },
                    type: { type: SchemaType.STRING, description: "before, after, derived_from, etc." },
                    confidence: { type: SchemaType.NUMBER },
                    explanation: { type: SchemaType.STRING, description: "Reason why these events are related" }
                },
                required: ["from_event_index", "to_event_index", "type", "explanation"]
            }
        },
        summary: {
            type: SchemaType.OBJECT,
            properties: {
                short: { type: SchemaType.STRING },
                detailed: { type: SchemaType.STRING }
            },
            required: ["short"]
        }
    },
    required: ["events", "relations", "summary"]
} as any; // Cast to any to bypass strict Schema typing issues temporarily, or explicit ResponseSchema

export const processEvidence = async (evidenceItems: any[]) => {
    // Separate heavy file data from metadata for the prompt
    const fileParts: any[] = [];
    const metadataItems = evidenceItems.map(item => {
        const { inlineData, ...rest } = item;
        if (inlineData && inlineData.data) {
            fileParts.push({
                inlineData: {
                    mimeType: inlineData.mimeType,
                    data: inlineData.data
                }
            });
        }
        return rest;
    });

    // Construct prompt
    const prompt = `
    Analyze the following evidence items to reconstruct a timeline of events.
    Refer to the attached images/documents for visual details (e.g., read text in images, describe scenes, identify objects).
    
    Evidence Metadata:
    ${JSON.stringify(metadataItems, null, 2)}
    
    Output a JSON object satisfying the schema.
    Infer timestamps from OCR text (clocks, dates), EXIF data, or context.
    Assign confidence scores.
    Assign confidence scores.
    Link events if they are related (chain of custody).
    CRITICAL: For every relationship in the "relations" array, you MUST provide a clear "explanation" string satisfying the schema, describing WHY these two events are connected.`;

    console.log("--------------- GEMINI API CALL START ---------------");
    console.log(`Using Model: ${model.model}`);
    console.log(`Sending ${fileParts.length} files for visual analysis.`);

    fileParts.forEach((part, i) => {
        console.log(`[DEBUG] Part ${i} inlineData: Mime=${part.inlineData?.mimeType}, DataLen=${part.inlineData?.data?.length}`);
    });

    console.log("Prompt Preview:", prompt.substring(0, 500) + "...");

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [
                    { text: prompt },
                    ...fileParts
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: timelineSchema
            }
        });

        const responseText = result.response.text();
        console.log("Gemini Raw Response:", responseText.substring(0, 200) + "..."); // Log only start to avoid spam
        console.log("--------------- GEMINI API CALL END ---------------");

        return JSON.parse(responseText);
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
