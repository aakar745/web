import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import PageSeo from '../models/PageSeo';
import logger from '../utils/logger';

// Get all page SEO settings (admin endpoint - shows both active and inactive)
export const getAllPageSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const pageSeos = await PageSeo.find({})
      .sort({ isActive: -1, priority: 1, pageName: 1 }); // Show active first, then inactive

    res.status(200).json({
      status: 'success',
      count: pageSeos.length,
      data: pageSeos
    });
  } catch (error: any) {
    logger.error('Error fetching page SEO settings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch page SEO settings'
    });
  }
});

// Get SEO settings for a specific page
export const getPageSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { pagePath } = req.params;
    
    const pageSeo = await PageSeo.findOne({ 
      pagePath: decodeURIComponent(pagePath), 
      isActive: true 
    });

    if (!pageSeo) {
      return res.status(404).json({
        status: 'error',
        message: 'SEO settings not found for this page'
      });
    }

    res.status(200).json({
      status: 'success',
      data: pageSeo
    });
  } catch (error: any) {
    logger.error('Error fetching page SEO:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch page SEO settings'
    });
  }
});

// Create new page SEO settings
export const createPageSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      pagePath,
      pageType,
      pageName,
      metaTitle,
      metaDescription,
      metaKeywords,
      canonicalUrl,
      ogImage,
      ogType,
      twitterCard,
      priority
    } = req.body;

    // Check if page SEO already exists
    const existingPageSeo = await PageSeo.findOne({ pagePath });
    if (existingPageSeo) {
      return res.status(400).json({
        status: 'error',
        message: 'SEO settings already exist for this page'
      });
    }

    const pageSeo = await PageSeo.create({
      pagePath,
      pageType,
      pageName,
      metaTitle,
      metaDescription,
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : [],
      canonicalUrl,
      ogImage,
      ogType: ogType || 'website',
      twitterCard: twitterCard || 'summary_large_image',
      priority: priority || 0
    });

    logger.info(`Created SEO settings for page: ${pagePath}`);

    res.status(201).json({
      status: 'success',
      data: pageSeo
    });
  } catch (error: any) {
    logger.error('Error creating page SEO:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create page SEO settings'
    });
  }
});

// Update page SEO settings
export const updatePageSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pageSeo = await PageSeo.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!pageSeo) {
      return res.status(404).json({
        status: 'error',
        message: 'Page SEO settings not found'
      });
    }

    logger.info(`Updated SEO settings for page: ${pageSeo.pagePath}`);

    res.status(200).json({
      status: 'success',
      data: pageSeo
    });
  } catch (error: any) {
    logger.error('Error updating page SEO:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update page SEO settings'
    });
  }
});

// Delete page SEO settings
export const deletePageSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pageSeo = await PageSeo.findByIdAndDelete(id);

    if (!pageSeo) {
      return res.status(404).json({
        status: 'error',
        message: 'Page SEO settings not found'
      });
    }

    logger.info(`Deleted SEO settings for page: ${pageSeo.pagePath}`);

    res.status(200).json({
      status: 'success',
      message: 'Page SEO settings deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting page SEO:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete page SEO settings'
    });
  }
});

// Initialize default SEO settings for common pages
export const initializeDefaultSeo = asyncHandler(async (req: Request, res: Response) => {
  try {
    const defaultPages = [
      {
        pagePath: '/',
        pageType: 'homepage',
        pageName: 'Homepage',
        metaTitle: 'Web Tools - Professional Image Optimization & Web Development Tools',
        metaDescription: 'Professional web tools for image optimization, compression, resizing, and conversion. Boost your website performance with our free online tools.',
        metaKeywords: ['web tools', 'image optimization', 'image compression', 'image resize', 'web development', 'performance'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 1
      },
      {
        pagePath: '/blog',
        pageType: 'blog-listing',
        pageName: 'Blog',
        metaTitle: 'Web Tools Blog - Tips, Tutorials & Web Development Insights',
        metaDescription: 'Expert tips, tutorials, and insights about web performance, image optimization, and modern web development. Stay updated with the latest trends.',
        metaKeywords: ['web development blog', 'image optimization tips', 'web performance', 'tutorials', 'web tools'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 2
      },
      {
        pagePath: '/image/compress',
        pageType: 'tool',
        pageName: 'Image Compression Tool',
        metaTitle: 'Free Image Compression Tool - Reduce Image Size Online',
        metaDescription: 'Compress your images without losing quality. Our free online tool reduces image file size by up to 80% while maintaining visual quality.',
        metaKeywords: ['image compression', 'compress images online', 'reduce image size', 'optimize images', 'free image compressor'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 3
      },
      {
        pagePath: '/image/resize',
        pageType: 'tool',
        pageName: 'Image Resize Tool',
        metaTitle: 'Free Image Resize Tool - Resize Images Online',
        metaDescription: 'Resize your images to any dimension with our free online tool. Maintain aspect ratio and quality while adjusting image dimensions.',
        metaKeywords: ['image resize', 'resize images online', 'change image size', 'image dimensions', 'free image resizer'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 4
      },
      {
        pagePath: '/image/convert',
        pageType: 'tool',
        pageName: 'Image Format Converter',
        metaTitle: 'Free Image Format Converter - Convert Images Online',
        metaDescription: 'Convert images between formats like JPG, PNG, WebP, and more. Free online tool with high-quality conversion and batch processing.',
        metaKeywords: ['image converter', 'convert images online', 'image format converter', 'jpg to png', 'webp converter'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 5
      },
      {
        pagePath: '/image/crop',
        pageType: 'tool',
        pageName: 'Image Crop Tool',
        metaTitle: 'Free Image Crop Tool - Crop Images Online',
        metaDescription: 'Crop your images with precision using our free online tool. Remove unwanted areas and focus on what matters most.',
        metaKeywords: ['image crop', 'crop images online', 'image editor', 'crop tool', 'free image cropper'],
        ogType: 'website',
        twitterCard: 'summary_large_image',
        priority: 6
      }
    ];

    const results: any[] = [];
    let created = 0;
    let existing = 0;

    for (const pageData of defaultPages) {
      const existingPage = await PageSeo.findOne({ pagePath: pageData.pagePath });
      
      if (!existingPage) {
        const pageSeo = await PageSeo.create(pageData);
        results.push(pageSeo);
        created++;
      } else {
        existing++;
      }
    }

    logger.info(`Initialized SEO settings: ${created} created, ${existing} already existed`);

    res.status(200).json({
      status: 'success',
      message: `Successfully initialized SEO settings`,
      data: {
        created,
        existing,
        total: defaultPages.length,
        results
      }
    });
  } catch (error: any) {
    logger.error('Error initializing default SEO:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize default SEO settings'
    });
  }
});

// Toggle page SEO active status
export const togglePageSeoStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pageSeo = await PageSeo.findById(id);
    if (!pageSeo) {
      return res.status(404).json({
        status: 'error',
        message: 'Page SEO settings not found'
      });
    }

    pageSeo.isActive = !pageSeo.isActive;
    await pageSeo.save();

    logger.info(`Toggled SEO status for page: ${pageSeo.pagePath} to ${pageSeo.isActive}`);

    res.status(200).json({
      status: 'success',
      data: pageSeo
    });
  } catch (error: any) {
    logger.error('Error toggling page SEO status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to toggle page SEO status'
    });
  }
}); 