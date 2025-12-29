import { Router } from 'express';
import multer from 'multer';
import { createCase, getCase, getUserCases, syncUser } from '../controllers/caseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Buffer for S3 upload

// Apply authMiddleware to protected routes
router.post('/sync-user', authMiddleware, syncUser);
router.post('/process-bundle', authMiddleware, upload.array('files'), createCase);
// router.get('/case/:id', authMiddleware, getCase); // Optional: protect read as well? Usually yes.
// Leaving read open for now IF it's shareable, but User Request implied "Users with THEIR case studies".
// So I should protect it.
router.get('/case/:id', authMiddleware, getCase);
router.get('/cases', authMiddleware, getUserCases);

export default router;
