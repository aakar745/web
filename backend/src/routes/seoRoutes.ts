import express from 'express';
import {
  getAllPageSeo,
  getPageSeo,
  createPageSeo,
  updatePageSeo,
  deletePageSeo,
  initializeDefaultSeo,
  togglePageSeoStatus
} from '../controllers/seoController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import PageSeo from '../models/PageSeo';

const router = express.Router();

// Debug route to see all paths
router.get('/debug/paths', async (req, res) => {
  try {
    const paths = await PageSeo.find({}).select('pagePath -_id');
    res.status(200).json({ paths: paths.map(p => p.pagePath) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get paths' });
  }
});

// Public route for getting SEO data (used by frontend pages)
router.get('/page/:pagePath', getPageSeo);

// Protected admin routes
router.use(protect);
router.use(restrictTo('admin'));

// Admin SEO management routes
router.get('/', getAllPageSeo);
router.post('/', createPageSeo);
router.put('/:id', updatePageSeo);
router.delete('/:id', deletePageSeo);
router.patch('/:id/toggle', togglePageSeoStatus);

// Initialize default SEO settings
router.post('/initialize', initializeDefaultSeo);

export default router; 