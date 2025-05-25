import mongoose from 'mongoose';

export interface IBlog extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: Date;
  status: 'published' | 'draft' | 'scheduled';
  scheduledPublishDate?: Date;
  author: mongoose.Types.ObjectId | string;
  category: string;
  tags: string[];
  featuredImage?: string;
  views: number;
  likes: number;
  likedByIPs: string[];
  readingTime?: string;
  createdAt: Date;
  updatedAt: Date;
  // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  // Analytics data
  pageViews?: number[];
  uniqueVisitors?: number;
  visitorIPs?: string[];
  averageTimeOnPage?: number;
  bounceRate?: number;
  // Comment settings
  commentsEnabled: boolean;
  requireCommentApproval: boolean;
  limitCommentsPerIp: boolean;
}

interface BlogModel extends mongoose.Model<IBlog> {
  // Custom static methods would go here
}

const BlogSchema = new mongoose.Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      maxlength: [300, 'Excerpt cannot be more than 300 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'scheduled'],
      default: 'draft',
    },
    scheduledPublishDate: Date,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    tags: [String],
    featuredImage: String,
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedByIPs: {
      type: [String],
      default: [],
    },
    readingTime: String,
    // SEO metadata fields
    metaTitle: {
      type: String,
      maxlength: [70, 'Meta title cannot be more than 70 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot be more than 160 characters'],
    },
    metaKeywords: [String],
    canonicalUrl: String,
    ogImage: String,
    // Analytics fields
    pageViews: [Number],
    uniqueVisitors: {
      type: Number,
      default: 0
    },
    visitorIPs: [String],
    averageTimeOnPage: {
      type: Number,
      default: 0
    },
    bounceRate: {
      type: Number,
      default: 0
    },
    // Comment settings
    commentsEnabled: {
      type: Boolean,
      default: true
    },
    requireCommentApproval: {
      type: Boolean,
      default: true
    },
    limitCommentsPerIp: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

// Create slug from title
BlogSchema.pre('validate', function(this: any, next) {
  if (this.title && !this.slug) {
    // Only create slug if it doesn't exist already
    const baseSlug = this.title
      .toLowerCase()
      // Remove any non-alphanumeric characters except spaces
      .replace(/[^\w\s-]/g, '')
      // Replace spaces with single hyphens
      .replace(/\s+/g, '-')
      // Remove any consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '');
    
    this.slug = baseSlug;
  } else if (this.slug) {
    // Clean up existing slugs if they have timestamps or random strings
    // Extract the base slug without any timestamp or random string
    const existingSlug = this.slug;
    const baseSlug = existingSlug
      // Remove timestamp pattern (typically a hyphen followed by numbers)
      .replace(/-+\d+$/, '')
      // Remove random string pattern (typically a hyphen followed by alphanumerics)
      .replace(/-+[a-z0-9]{5,7}$/, '')
      // Remove any consecutive hyphens that might be left
      .replace(/-+/g, '-')
      // Remove trailing hyphens
      .replace(/-+$/g, '');
    
    this.slug = baseSlug;
  }
  
  // Calculate reading time (rough estimate)
  if (this.content) {
    const words = this.content.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    this.readingTime = `${minutes} min read`;
  }
  
  // Set metaTitle to title if not provided
  if (this.title && !this.metaTitle) {
    this.metaTitle = this.title;
  }
  
  // Set metaDescription to excerpt if not provided
  if (this.excerpt && !this.metaDescription) {
    this.metaDescription = this.excerpt;
  }
  
  next();
});

// Handle slug collisions by adding a number suffix only if needed
BlogSchema.pre('save', async function(this: any, next) {
  if (this.isModified('slug')) {
    const baseSlug = this.slug;
    let slugToCheck = baseSlug;
    let counter = 1;
    let isUnique = false;
    
    // Try to find a unique slug by adding a numeric suffix if needed
    while (!isUnique) {
      // Check if current slug version exists (excluding this document)
      const existingDoc = await mongoose.models.Blog.findOne({
        slug: slugToCheck,
        _id: { $ne: this._id }
      });
      
      if (!existingDoc) {
        // The slug is unique, we can use it
        isUnique = true;
      } else {
        // Slug exists, try the next numeric suffix
        slugToCheck = `${baseSlug}-${counter}`;
        counter++;
      }
      
      // Safety check - don't loop too many times
      if (counter > 100) {
        // If we've tried 100 suffixes, just add a timestamp as a last resort
        slugToCheck = `${baseSlug}-${Date.now().toString().slice(-6)}`;
        isUnique = true;
      }
    }
    
    // Set the final unique slug
    this.slug = slugToCheck;
  }
  
  next();
});

// Check if the model already exists to prevent recompilation error
const Blog = mongoose.models.Blog || mongoose.model<IBlog, BlogModel>('Blog', BlogSchema);

export default Blog; 