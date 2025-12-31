import { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { uploadFile } from '../services/storageService';
import { processEvidence } from '../services/aiService';

let db: any;
if (process.env.MONGO_URI) {
    new MongoClient(process.env.MONGO_URI, { tlsInsecure: true }).connect()
        .then(client => {
            db = client.db("evidex");
            console.log("Controller connected to DB");
        })
        .catch(err => {
            console.error("Controller failed to connect to DB:", err);
            // Don't crash, just log. APIs using 'db' will likely fail 500 if called.
        });
}

export const syncUser = async (req: Request, res: Response) => {
    console.log("[SYNC] syncUser called");
    try {
        const user = req.user;
        if (!user) {
            console.log("[SYNC] Unauthorized: No user in request");
            return res.status(401).json({ error: "Unauthorized" });
        }
        console.log(`[SYNC] Syncing user: ${user.email} (${user.uid})`);

        await db.collection("users").updateOne(
            { uid: user.uid },
            {
                $set: {
                    email: user.email,
                    lastLogin: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    role: 'investigator'
                }
            },
            { upsert: true }
        );

        res.json({ success: true, message: "User synced" });
    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createCase = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const metadataRaw = req.body.metadata;
        const user = req.user; // Added by authMiddleware

        if (!user) {
            return res.status(401).json({ error: "Unauthorized: User context missing" });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        console.log(`Processing ${files.length} files for user ${user.uid}...`);

        // Ensure user exists in DB
        // We upsert the user info based on what we have from the token (uid, email)
        await db.collection("users").updateOne(
            { uid: user.uid },
            {
                $set: {
                    email: user.email,
                    lastLogin: new Date(),
                    // Update other profile fields if available
                },
                $setOnInsert: {
                    createdAt: new Date(),
                    role: 'investigator' // Default role
                }
            },
            { upsert: true }
        );

        // Parse client-provided metadata (OCR, EXIF)
        let clientMetadata: any = {};
        try {
            clientMetadata = JSON.parse(metadataRaw || '{}');
        } catch (e) {
            console.warn("Failed to parse metadata", e);
        }

        // 1. Upload files to Storage
        const uploadPromises = files.map(async (file) => {
            const url = await uploadFile(file);

            // Forensic Feature: Calculate SHA-256 Hash
            const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

            return {
                originalName: file.originalname,
                url,
                mimeType: file.mimetype,
                size: file.size,
                hash,
                hashAlgorithm: 'SHA-256'
            };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // 2. Prepare payload for AI
        const evidenceItems = uploadedFiles.map((file, index) => {
            const originalFile = files[index];
            const meta = clientMetadata[file.originalName] || {};

            return {
                filename: file.originalName,
                url: file.url,
                file_type: file.mimeType,
                inlineData: {
                    mimeType: file.mimeType,
                    data: originalFile.buffer.toString('base64')
                },
                ...meta
            };
        });

        // 3. Call Gemini
        console.log("Calling Gemini...");
        let aiResult: any;

        // Extract context if available
        const caseContext = clientMetadata.case_configuration?.context;

        if (caseContext) {
            console.log(`[AI] Including user context: "${caseContext.substring(0, 50)}..."`);
        }

        try {
            aiResult = await processEvidence(evidenceItems, caseContext);
        } catch (error) {
            console.error("AI Analysis failed, switching to Deterministic Fallback:", error);
            aiResult = generateFallbackTimeline(uploadedFiles);
        }

        // Map filenames in AI result back to storage URLs
        if (aiResult.events && Array.isArray(aiResult.events)) {
            aiResult.events = aiResult.events.map((event: any) => {
                const matchingFile = uploadedFiles.find(f => f.originalName === event.source_file);
                if (matchingFile) {
                    return {
                        ...event,
                        source_file: matchingFile.url
                    };
                }
                return event;
            });
        }

        // 4. Save to MongoDB

        // OPTIMIZATION: Remove large Base64 inlineData before saving to DB
        const evidenceForDb = evidenceItems.map(item => {
            const { inlineData, ...rest } = item;
            return rest;
        });

        const caseDoc = {
            userId: user.uid, // Store the Firebase UID
            userEmail: user.email, // Convenient for display, though redundant
            createdAt: new Date(),
            files: uploadedFiles,
            timeline: aiResult,
            evidenceItems: evidenceForDb
        };

        const result = await db.collection("cases").insertOne(caseDoc);

        res.json({
            success: true,
            caseId: result.insertedId,
            case: caseDoc
        });

    } catch (error: any) {
        console.error("Error creating case:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

export const getCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        // Find the case
        const caseDoc = await db.collection("cases").findOne({ _id: new ObjectId(id) });

        if (!caseDoc) {
            return res.status(404).json({ error: "Case not found" });
        }

        // Security Check: Ensure the case belongs to the requesting user
        if (caseDoc.userId !== user.uid) {
            return res.status(403).json({ error: "Forbidden: You do not have access to this case" });
        }

        res.json(caseDoc);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// List User Cases
export const getUserCases = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 9;
        const skip = (page - 1) * limit;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Projection: Exclude heavy data (evidenceItems, full events)
        const projection = {
            evidenceItems: 0,
            "timeline.events": { $slice: 5 }, // Only get first 5 events for preview
            "timeline.relations": 0 // relationships not needed for list
        };

        const totalCases = await db.collection("cases").countDocuments({ userId: user.uid });

        const cases = await db.collection("cases")
            .find({ userId: user.uid })
            .project(projection)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        res.json({
            cases,
            pagination: {
                total: totalCases,
                page,
                limit,
                pages: Math.ceil(totalCases / limit)
            }
        });
    } catch (error) {
        console.error("Error listing cases:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Helper: Deterministic Fallback when AI fails
const generateFallbackTimeline = (files: any[]) => {
    const events = files.map(file => {
        // Extract timestamp from filename if possible (e.g., 1766...)
        // Default to current time if no pattern found, but ideally should use file creation time if available (multer doesn't give creation time easily without extra config)
        let timestamp = new Date().toISOString();
        const match = file.originalName.match(/^(\d{13})/);

        if (match) {
            timestamp = new Date(parseInt(match[1])).toISOString();
        }

        return {
            timestamp: timestamp,
            confidence: 0.1, // Low confidence to indicate fallback
            description: `File uploaded: ${file.originalName}`,
            explanation: "Timestamp inferred from filename or upload time. (AI Unavailable)",
            source_file: file.url
        };
    });

    // Sort by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
        events: events,
        relations: [],
        summary: {
            short: "Timeline reconstructed from file metadata (AI Analysis Unavailable).",
            detailed: "The AI service was unavailable or encountered an error. This timeline is based solely on file timestamps and names."
        }
    };
};
