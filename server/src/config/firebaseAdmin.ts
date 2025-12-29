import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Standard way: Check for service account path in Env, or default to a file
// If relying on ADC (Google Cloud environment), this is not needed as explicitly.
// But valid for local dev if file exists.

try {
    // If user provides a service account path in .env
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log("Firebase Admin initialized with Application Default Credentials");
    } else {
        // Fallback: Try to look for serviceAccountKey.json in config
        // We will initialize with no arguments if we want to rely on auto-discovery,
        // OR just print a warning if not found.
        // For now, let's Initialize assuming it might work or let it fail gracefully later.
        admin.initializeApp({
            projectId: 'studentsafety-97a6a' // Explicitly set from client config
        });
        console.log("Firebase Admin initialized (default with projectId)");
    }
} catch (error) {
    console.warn("Firebase Admin verification failed to initialize:", error);
}

export default admin;
