import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';

// Initialize S3 Client (works for Cloudflare R2 too)
const s3 = new S3Client({
    region: process.env.AWS_REGION || "auto",
    endpoint: process.env.AWS_ENDPOINT, // Required for R2
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export const uploadFile = async (file: Express.Multer.File): Promise<string> => {
    // If AWS credentials are NOT provided, use local storage
    if (!process.env.AWS_ACCESS_KEY_ID) {
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const fileKey = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = path.join(uploadsDir, fileKey);

        fs.writeFileSync(filePath, file.buffer);

        // Return local URL
        const port = process.env.PORT || 5000;
        return `http://localhost:${port}/uploads/${fileKey}`;
    }

    if (!process.env.AWS_BUCKET_NAME) {
        throw new Error("AWS_BUCKET_NAME is not defined in .env");
    }

    const fileKey = `${Date.now()}-${file.originalname}`;

    try {
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer, // Buffer from memory storage
            ContentType: file.mimetype,
        });

        await s3.send(command);

        // Return public URL (assuming public bucket or presigned logic needed later)
        // For R2/S3, usually: https://bucket.endpoint/key
        // For now returning a constructed URL based on assumption
        const endpoint = process.env.AWS_PUBLIC_ENDPOINT || process.env.AWS_ENDPOINT;
        return `${endpoint}/${fileKey}`;
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw new Error("Failed to upload file to storage.");
    }
};
