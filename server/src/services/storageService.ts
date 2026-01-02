import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import path from 'path';

// Initialize GCS Storage
// We point to the service account key file we just created.
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, '../../evidex-service-account.json'), 'utf-8'));

const storage = new Storage({
    projectId: serviceAccount.project_id,
    credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key, // Use raw key (Node handles newlines in JSON parse)
    }
});

const bucketName = process.env.GCS_BUCKET_NAME || 'evidex-media-bucket';

// Debug: Verify connection and bucket existence
const verifyConnection = async () => {
    try {
        console.log("Verifying GCS Connection...");
        const [buckets] = await storage.getBuckets();
        console.log("Connected! Available Buckets:", buckets.map(b => b.name));

        const bucket = storage.bucket(bucketName);
        const [exists] = await bucket.exists();
        if (!exists) {
            console.error(`CRITICAL: Bucket '${bucketName}' does not exist!`);
        } else {
            console.log(`Bucket '${bucketName}' exists and is accessible.`);
        }
    } catch (err: any) {
        console.error("GCS Connection FAILED:", err.message);
        if (err.message.includes("DECODER")) {
            console.error("Hint: Private Key decoding failed. Check newline formatting.");
        }
    }
};
verifyConnection();

export const uploadFile = async (file: Express.Multer.File): Promise<{ url: string; key: string }> => {
    try {
        const bucket = storage.bucket(bucketName);
        const fileKey = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const blob = bucket.file(fileKey);

        return new Promise((resolve, reject) => {
            blob.save(file.buffer, {
                metadata: { contentType: file.mimetype },
                resumable: false
            }, async (err) => {
                if (err) {
                    console.error("GCS Upload Error:", err);
                    return reject(err);
                }

                try {
                    // Generate a Signed URL (Get Read Access)
                    // Max duration for V4 signing is 7 days (604800 seconds).
                    const [url] = await blob.getSignedUrl({
                        action: 'read',
                        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
                    });

                    resolve({ url, key: fileKey });
                } catch (signErr) {
                    console.error("Error signing URL:", signErr);
                    reject(signErr);
                }
            });
        });

    } catch (error) {
        console.error("GCS Service Error:", error);
        throw new Error("Failed to upload file to Google Cloud Storage.");
    }
};

export const deleteFile = async (fileKey: string): Promise<void> => {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileKey);
        await file.delete();
        console.log(`Deleted GCS file: ${fileKey}`);
    } catch (error: any) {
        console.error(`Failed to delete GCS file ${fileKey}:`, error.message);
        // We do not throw here to avoid preventing case deletion if file is already gone
    }
};
