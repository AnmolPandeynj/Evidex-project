import { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import crypto from 'crypto';
import { uploadFile, deleteFile } from '../services/storageService';
import { processEvidence } from '../services/aiService';
import admin from '../config/firebaseAdmin';

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

import { USAGE_LIMITS } from '../config/limits';

// PHASE 1: Analyze (Transient, No Storage)
export const analyzeEvidence = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const metadataRaw = req.body.metadata;
        const user = req.user;

        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

        console.log(`[ANALYZE] Processing ${files.length} files for user ${user.uid} (Transient)`);

        // Check file count limit per case (Quick Fail)
        if (files.length > USAGE_LIMITS.FREE_TIER.MAX_FILES_PER_CASE) {
            return res.status(400).json({
                error: `Too many files. Limit is ${USAGE_LIMITS.FREE_TIER.MAX_FILES_PER_CASE}.`
            });
        }

        // Parse metadata
        let clientMetadata: any = {};
        try { clientMetadata = JSON.parse(metadataRaw || '{}'); } catch (e) { }

        // Prepare for AI (Memory Only)
        const evidenceItems = files.map((file) => {
            const meta = clientMetadata[file.originalname] || {};
            return {
                filename: file.originalname,
                file_type: file.mimetype,
                inlineData: {
                    mimeType: file.mimetype,
                    data: file.buffer.toString('base64')
                },
                ...meta
            };
        });

        // Call Gemini
        console.log("[ANALYZE] Calling AI Service...");
        const caseContext = clientMetadata.case_configuration?.context;
        let aiResult;

        try {
            aiResult = await processEvidence(evidenceItems, caseContext);
        } catch (error) {
            console.error("[ANALYZE] AI Failed, using fallback");
            // Basic fallback without URLs since we haven't uploaded
            aiResult = generateFallbackTimeline(files.map(f => ({ originalName: f.originalname, url: null })));
        }

        // Return Analysis directly (Stateless)
        res.json({
            success: true,
            analysis: aiResult,
            meta: {
                fileCount: files.length,
                isDraft: true
            }
        });

    } catch (error: any) {
        console.error("Error analyzing evidence:", error);
        res.status(500).json({ error: error.message || "Analysis Failed" });
    }
};

// PHASE 2: Save (Persistent, Storage Costs)
export const saveCase = async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        const timelineRaw = req.body.timeline; // Passed from frontend after review
        const user = req.user;

        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (!files || files.length === 0) return res.status(400).json({ error: "No files to save" });

        // --- LIMIT CHECKS ---
        const userStats = await db.collection("cases").aggregate([
            { $match: { userId: user.uid } },
            {
                $group: {
                    _id: null,
                    totalCases: { $sum: 1 },
                    totalSize: { $sum: "$totalSizeBytes" }
                }
            }
        ]).toArray();

        const currentCases = userStats[0]?.totalCases || 0;
        const currentSize = userStats[0]?.totalSize || 0;
        const newSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

        if (currentCases >= USAGE_LIMITS.FREE_TIER.MAX_CASES) {
            return res.status(403).json({ error: "Case Limit Exceeded. Please upgrade or delete old cases." });
        }
        if (currentSize + newSizeBytes > USAGE_LIMITS.FREE_TIER.MAX_STORAGE_BYTES) {
            return res.status(403).json({ error: "Storage Quota Exceeded. Free tier limit is 500MB." });
        }
        // --------------------

        console.log(`[SAVE] Persisting case for ${user.uid}. Size: ${(newSizeBytes / 1024 / 1024).toFixed(2)}MB`);

        // 1. Upload to GCS
        const uploadPromises = files.map(async (file) => {
            const { url, key } = await uploadFile(file);
            const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
            return {
                originalName: file.originalname,
                url,
                storageKey: key,
                mimeType: file.mimetype,
                size: file.size,
                hash,
                hashAlgorithm: 'SHA-256'
            };
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // 2. Process Timeline (Re-hydrate URLs if needed)
        let timeline = JSON.parse(timelineRaw || '{}');
        // Update source_files in timeline to point to GCS URLs
        if (timeline.events) {
            timeline.events = timeline.events.map((evt: any) => {
                const match = uploadedFiles.find(f => f.originalName === evt.source_file);
                return match ? { ...evt, source_file: match.url } : evt;
            });
        }

        // 3. Save to DB
        const caseDoc = {
            userId: user.uid,
            userEmail: user.email,
            createdAt: new Date(),
            files: uploadedFiles,
            totalSizeBytes: newSizeBytes, // Tracking for quota
            timeline: timeline,
            status: 'active'
        };

        const result = await db.collection("cases").insertOne(caseDoc);

        // Sync user activity
        await db.collection("users").updateOne(
            { uid: user.uid },
            { $set: { lastActive: new Date() }, $inc: { caseCount: 1 } }
        );

        res.json({
            success: true,
            caseId: result.insertedId,
            case: caseDoc
        });

    } catch (error: any) {
        console.error("Error saving case:", error);
        res.status(500).json({ error: error.message });
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

// List User Cases with Search & Sort
export const getUserCases = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 9;
        const search = (req.query.search as string || '').trim();
        const sortBy = req.query.sortBy as string || 'date'; // 'date' | 'files'
        const order = req.query.order === 'asc' ? 1 : -1;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const matchStage: any = { userId: user.uid };

        if (search) {
            // Case-insensitive regex search
            const regex = new RegExp(search, 'i');

            // Try to match Object ID (if valid hex) OR contents
            const orConditions: any[] = [
                { "timeline.summary.short": regex },
                { "timeline.verdict.description": regex }, // Search verdict too
                { "timeline.verdict.title": regex }
            ];

            // Only attempt ObjectId match if string is potentially an ID
            if (/^[0-9a-fA-F]{24}$/.test(search)) {
                orConditions.push({ _id: new ObjectId(search) });
            }
            // Also partial match on ID string representation if we convert it? 
            // MongoDB manual find on _id string is tough. 
            // We can search by file names too?
            orConditions.push({ "files.originalName": regex });

            matchStage.$or = orConditions;
        }

        const sortStage: any = {};
        if (sortBy === 'files') {
            sortStage.fileCount = order;
        } else {
            sortStage.createdAt = order;
        }
        // Secondary sort by ID for stability
        sortStage._id = -1;

        const pipeline = [
            { $match: matchStage },
            {
                $project: {
                    // Inclusion only to avoid mixing 0 and 1
                    _id: 1,
                    userId: 1,
                    createdAt: 1,
                    files: 1,
                    // Use dot notation for specific timeline fields
                    "timeline.summary": 1,
                    "timeline.verdict": 1,
                    "timeline.events": { $slice: ["$timeline.events", 5] }, // Preview events
                    // Calculate file count for sorting
                    fileCount: { $size: { $ifNull: ["$files", []] } }
                }
            },
            { $sort: sortStage },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit }
                    ]
                }
            }
        ];

        const result = await db.collection("cases").aggregate(pipeline).toArray();

        const data = result[0].data;
        const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

        res.json({
            cases: data,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error listing cases:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteCase = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ID" });
        }

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check ownership before deleting
        const caseDoc = await db.collection("cases").findOne({ _id: new ObjectId(id) });

        if (!caseDoc) {
            return res.status(404).json({ error: "Case not found" });
        }

        if (caseDoc.userId !== user.uid) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to delete this case" });
        }

        // Delete files from GCS
        if (caseDoc.files && Array.isArray(caseDoc.files)) {
            console.log(`[DELETE CASE] Removing ${caseDoc.files.length} files from GCS...`);
            await Promise.all(caseDoc.files.map((file: any) => {
                if (file.storageKey) {
                    return deleteFile(file.storageKey);
                }
                return Promise.resolve();
            }));
        }

        // Delete from DB
        const result = await db.collection("cases").deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            res.json({ success: true, message: "Case deleted successfully" });
        } else {
            res.status(500).json({ error: "Failed to delete case" });
        }

    } catch (error) {
        console.error("Error deleting case:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteAccount = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        console.log(`[ACCOUNT DELETION] Requested for user: ${user.uid} (${user.email})`);

        // 1. Delete all cases associated with the user
        // FETCH CASES FIRST TO DELETE FILES
        const userCases = await db.collection("cases").find({ userId: user.uid }).toArray();
        console.log(`[ACCOUNT DELETION] Found ${userCases.length} cases to cleanup.`);

        for (const c of userCases) {
            if (c.files && Array.isArray(c.files)) {
                await Promise.all(c.files.map((f: any) => {
                    if (f.storageKey) return deleteFile(f.storageKey);
                    return Promise.resolve();
                }));
            }
        }

        const caseDeleteResult = await db.collection("cases").deleteMany({ userId: user.uid });
        console.log(`[ACCOUNT DELETION] Deleted ${caseDeleteResult.deletedCount} cases.`);

        // 2. Delete user record from MongoDB
        const userDeleteResult = await db.collection("users").deleteOne({ uid: user.uid });
        console.log(`[ACCOUNT DELETION] Deleted user record from MongoDB.`);

        // 3. Delete user from Firebase Auth
        try {
            await admin.auth().deleteUser(user.uid);
            console.log(`[ACCOUNT DELETION] Deleted user from Firebase Auth.`);
        } catch (firebaseError) {
            console.error("[ACCOUNT DELETION] Failed to delete user from Firebase:", firebaseError);
            // We continue even if Firebase deletion fails (maybe already deleted?), but logging it is important.
            // In a strict mode, we might want to alert the user, but since DB is gone, access is effectively revoked.
        }

        res.json({ success: true, message: "Account deleted successfully." });

    } catch (error) {
        console.error("Error deleting account:", error);
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
