import express from 'express';
import { createAudit, getUserAudits } from '../controllers/auditController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createAudit);
router.get('/history', authMiddleware, getUserAudits);

export default router;
