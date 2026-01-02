import { Router } from 'express';
import multer from 'multer';
import { analyzeEvidence, saveCase, getCase, getUserCases, syncUser, deleteCase, deleteAccount } from '../controllers/caseController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Buffer for GCS upload

// Apply authMiddleware to protected routes
router.post('/sync-user', authMiddleware, syncUser);

// Phase 1: Transient Analysis (No Storage)
router.post('/analyze', authMiddleware, upload.array('files'), analyzeEvidence);

// Phase 2: Persistent Save (Checks Limits, Uploads to GCS)
router.post('/cases', authMiddleware, upload.array('files'), saveCase);

router.get('/case/:id', authMiddleware, getCase);
router.get('/cases', authMiddleware, getUserCases);
router.delete('/cases/:id', authMiddleware, deleteCase);
router.delete('/account', authMiddleware, deleteAccount);

export default router;
