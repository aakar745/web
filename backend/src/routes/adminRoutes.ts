import express from 'express';
import * as adminController from '../controllers/adminController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Restrict to admin role
router.use(restrictTo('admin'));

// Cleanup routes
router.post('/cleanup-images', adminController.cleanupImages);

export default router; 