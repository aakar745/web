'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DynamicMeta } from '@/components/meta/DynamicMeta'
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Facebook,
  Link2,
  Tag,
  Twitter,
  UserIcon,
  EyeIcon,
  Linkedin,
  Bookmark,
  Share2,
  MessageSquare,
  List,
  Heart,
  Copy,
  ChevronUp,
  Share,
  BookmarkIcon,
  Instagram,
  X,
} from 'lucide-react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { apiRequest } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// Define blog post interface
interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  status: string;
  author: { name: string; email: string } | string;
  category: string;
  tags: string[];
  featuredImage?: string;
  views: number;
  likes: number;
  readingTime?: string;
  slug: string;
  // SEO metadata fields
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  // Comment settings
  commentsEnabled?: boolean;
  requireCommentApproval?: boolean;
  limitCommentsPerIp?: boolean;
}

// Component to get related posts based on tags
const getRelatedPosts = (currentPost: BlogPost, allPosts: BlogPost[]) => {
  if (!currentPost) return []
  
  // Filter out the current post and get posts with matching tags
  return allPosts
    .filter(post => post._id !== currentPost._id)
    .map(post => {
      // Count matching tags
      const matchingTags = post.tags.filter(tag => 
        currentPost.tags.includes(tag)
      ).length
      
      return { ...post, matchingTags }
    })
    .filter(post => post.matchingTags > 0) // Only include posts with at least one matching tag
    .sort((a, b) => b.matchingTags - a.matchingTags) // Sort by number of matching tags
    .slice(0, 3) // Get top 3 related posts
}

interface HeadingInfo {
  id: string;
  text: string;
  level: number;
}

// Import the WhatsApp icon since it's not available in lucide
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.274-.101-.475-.15-.676.15-.2.301-.767.966-.94 1.164-.173.199-.347.223-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.353.451-.528.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.483.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.223-.571-.372m-5.448 7.45h-.016a9.156 9.156 0 01-4.678-1.28l-.335-.201-3.465.908.928-3.39-.222-.347a9.19 9.19 0 01-1.398-4.895c0-5.088 4.139-9.227 9.228-9.227 2.463 0 4.776.96 6.515 2.699 1.738 1.742 2.694 4.058 2.694 6.516 0 5.091-4.139 9.228-9.231 9.228"/>
    <path d="M12.001 2.002a9.965 9.965 0 00-9.964 9.965c0 1.725.444 3.407 1.285 4.903l-1.36 4.965 5.09-1.334a9.975 9.975 0 004.942 1.296h.004c5.5 0 9.965-4.465 9.966-9.966 0-2.664-1.04-5.168-2.926-7.054-1.887-1.887-4.392-2.926-7.055-2.926l-.016.016.032-.032z" fill="none"/>
  </svg>
);

// Define a Comment interface
interface Comment {
  _id: string;
  text: string;
  name: string;
  email: string;
  approved: boolean;
  ipAddress: string;
  createdAt: string;
  replies?: Comment[];
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const blogId = params.id as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [headings, setHeadings] = useState<HeadingInfo[]>([])
  const [activeHeading, setActiveHeading] = useState<string>('')
  const [readingProgress, setReadingProgress] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  
  const articleRef = useRef<HTMLDivElement>(null)
  
  // Categories and latest posts state
  const [categories, setCategories] = useState<string[]>([])
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  
  // Format author name
  const getAuthorName = (author: { name: string; email: string } | string): string => {
    if (typeof author === 'string') {
      return 'Anonymous'
    }
    return author.name
  }
  
  // Format author initials
  const getAuthorInitials = (author: { name: string; email: string } | string): string => {
    if (typeof author === 'string') {
      return 'A'
    }
    return author.name.split(' ').map(n => n[0]).join('')
  }
  
  // Copy current URL to clipboard
  const copyToClipboard = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "The link has been copied to your clipboard.",
      duration: 2000,
    })
  }
  
  // Handle liking a post with persistence
  const handleLike = async () => {
    if (!post) return;
    
    // If already liked, don't allow unliking
    if (liked) {
      toast({
        title: "Already liked",
        description: "You've already liked this article!",
        duration: 2000,
      });
      return;
    }
    
    // Set new state to true (only allow liking, not unliking)
    const newLikedState = true;
    
    // Optimistically update the UI
    setLiked(newLikedState);
    setLikeCount(prevCount => prevCount + 1);
    
    try {
      // Make real API call to update like status
      const response = await apiRequest<{
        status: string;
        data: { likes: number; hasLiked: boolean };
      }>(`/blogs/${post._id}/like`, {
        method: 'POST',
        body: { liked: newLikedState },
      });
      
      if (response.status === 'success') {
        // Update with the actual count from the server
        setLikeCount(response.data.likes);
        setLiked(response.data.hasLiked);
        
        toast({
          title: "Thanks for your like!",
          description: "We're glad you enjoyed this article!",
          duration: 2000,
        });
      } else {
        throw new Error('Failed to update like');
      }
    } catch (error) {
      // If the API call fails, revert the optimistic update
      console.error('Error updating like on server:', error);
      setLiked(false);
      setLikeCount(prevCount => prevCount - 1);
      
      toast({
        title: 'Error',
        description: 'Failed to update like status. Please try again.',
        variant: 'destructive',
      });
    }
  }
  
  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
  
  // Extract headings from the content
  const extractHeadings = (htmlContent: string) => {
    if (typeof window === 'undefined') {
      return { headingsData: [], updatedContent: htmlContent };
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Safe query for heading elements
      const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6') || []);
      
      const headingsData = headingElements.map((el, index) => {
        // Create an ID from the heading text if not present
        const headingId = el.id || `heading-${index}`;
        
        // Apply the ID to the element - safely
        if (!el.id) {
          el.id = headingId;
        }
        
        return {
          id: headingId,
          text: el.textContent || `Heading ${index + 1}`,
          level: parseInt(el.tagName.substring(1), 10) || 2 // Default to h2 if parsing fails
        };
      });
      
      return { 
        headingsData, 
        updatedContent: doc.body.innerHTML 
      };
    } catch (error) {
      console.error('Error extracting headings:', error);
      return { headingsData: [], updatedContent: htmlContent };
    }
  };
  
  // Track reading progress and active heading
  useEffect(() => {
    if (typeof window === 'undefined' || !articleRef.current) return;
    
    const handleScroll = () => {
      try {
        if (articleRef.current) {
          const element = articleRef.current;
          const totalHeight = element.clientHeight;
          const windowHeight = window.innerHeight;
          const scrollTop = window.scrollY;
          
          // How far scrolled in the article in percentage
          const scrolled = (scrollTop / (totalHeight - windowHeight)) * 100;
          setReadingProgress(Math.min(Math.max(scrolled, 0), 100));
          
          // Show scroll to top button after 50% progress
          setShowScrollTop(scrolled > 50);
          
          // Track active heading - safer implementation
          if (headings.length > 0) {
            // Find all heading elements that exist in the DOM
            let foundActiveHeading = false;
            
            for (let i = headings.length - 1; i >= 0; i--) {
              const headingElement = document.getElementById(headings[i].id);
              
              if (headingElement && headingElement.getBoundingClientRect().top <= 100) {
                setActiveHeading(headings[i].id);
                foundActiveHeading = true;
                break;
              }
            }
            
            // If no active heading found (maybe at very top of page)
            if (!foundActiveHeading && headings.length > 0) {
              setActiveHeading(headings[0].id);
            }
          }
        }
      } catch (error) {
        console.error('Error in scroll handler:', error);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);
  
  // Fetch blog post data
  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        setLoading(true)
        setError(false)
        
        // First try to fetch by slug using the new endpoint
        try {
          // This is likely a slug if it doesn't look like a MongoDB ID
          const isSlug = !blogId.match(/^[0-9a-fA-F]{24}$/);
          
          if (isSlug) {
            const response = await apiRequest<{
              status: string;
              data: BlogPost;
            }>(`/blogs/by-slug/${encodeURIComponent(blogId)}`, { 
              noRedirect: true 
            });
            
            if (response.data) {
              // Set the post data after processing
              setPost(response.data);
              
              // Process headings and update content
              const { headingsData, updatedContent } = extractHeadings(response.data.content);
              setHeadings(headingsData);
              
              // Set the actual like count from the database
              setLikeCount(response.data.likes || 0);
              
              // Check if user has already liked via API
              const likeStatusResponse = await apiRequest<{
                status: string;
                data: { hasLiked: boolean; likes: number };
              }>(`/blogs/${response.data._id}/like`, {
                method: 'GET',
                noRedirect: true
              });
              
              if (likeStatusResponse.status === 'success') {
                setLiked(likeStatusResponse.data.hasLiked);
              }
              
              // Fetch related posts (posts with similar tags)
              if (response.data.tags && response.data.tags.length > 0) {
                const allPostsResponse = await apiRequest<{
                  status: string;
                  data: BlogPost[];
                }>('/blogs', { 
                  noRedirect: true 
                });
                
                if (allPostsResponse.data) {
                  const related = getRelatedPosts(response.data, allPostsResponse.data);
                  setRelatedPosts(related);
                }
              }
              
              // Update the content with the heading IDs for the TOC to work
              const contentWithIds = { ...response.data, content: updatedContent };
              setPost(contentWithIds);
              
              return; // Exit early if found by slug
            }
          }
        } catch (slugError) {
          console.log('Not found by slug, trying ID...', slugError);
        }
        
        // If not found by slug or it's a MongoDB ID, try to fetch by ID
        const response = await apiRequest<{
          status: string;
          data: BlogPost;
        }>(`/blogs/${blogId}`, { 
          noRedirect: true 
        });
        
        setPost(response.data);
        
        // Process headings and update content
        const { headingsData, updatedContent } = extractHeadings(response.data.content);
        setHeadings(headingsData);
        
        // Set the actual like count from the database
        setLikeCount(response.data.likes || 0);
        
        // Check if user has already liked via API
        const likeStatusResponse = await apiRequest<{
          status: string;
          data: { hasLiked: boolean; likes: number };
        }>(`/blogs/${response.data._id}/like`, {
          method: 'GET',
          noRedirect: true
        });
        
        if (likeStatusResponse.status === 'success') {
          setLiked(likeStatusResponse.data.hasLiked);
        }
        
        // Update URL to use slug if available (for better SEO)
        // But don't cause a page reload - just update the address bar
        if (response.data.slug && blogId !== response.data.slug) {
          window.history.pushState(
            { id: response.data._id, slug: response.data.slug },
            '',
            `/blog/${response.data.slug}`
          );
        }
        
        // Fetch related posts (posts with similar tags)
        const allPostsResponse = await apiRequest<{
          status: string;
          data: BlogPost[];
        }>('/blogs', { 
          noRedirect: true 
        });
        
        if (allPostsResponse.data && response.data) {
          const related = getRelatedPosts(response.data, allPostsResponse.data);
          setRelatedPosts(related);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setError(true);
        toast({
          title: 'Error',
          description: 'Failed to load the blog post. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (blogId) {
      fetchBlogPost();
    }
  }, [blogId, router]);
  
  // Load comments from localStorage
  useEffect(() => {
    if (!post) return;
    
    const fetchComments = async () => {
      try {
        const response = await apiRequest<{ status: string; data: Comment[]; total: number; page: number; pages: number }>(
          `/blogs/${post._id}/comments?limit=5`, 
          { requireAuth: false }
        );
        
        setComments(response.data);
        setCommentCount(response.total);
        setCommentPage(1);
        setHasMoreComments(response.pages > 1);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
        setCommentCount(0);
        setHasMoreComments(false);
      }
    };
    
    fetchComments();
  }, [post]);
  
  // Fetch categories and latest posts
  useEffect(() => {
    const fetchCategoriesAndLatest = async () => {
      try {
        // Fetch all blog posts to extract categories
        const allPostsResponse = await apiRequest<{
          status: string;
          data: BlogPost[];
        }>('/blogs?limit=20', { 
          noRedirect: true 
        });
        
        if (allPostsResponse.data) {
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(allPostsResponse.data.map(post => post.category))
          ).sort();
          setCategories(uniqueCategories);
          
          // Get latest posts (sorted by date)
          const latest = [...allPostsResponse.data]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3); // Show only 3 latest posts
          setLatestPosts(latest);
        }
      } catch (error) {
        console.error('Error fetching categories and latest posts:', error);
      }
    };
    
    fetchCategoriesAndLatest();
  }, []);
  
  // Add email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Add URL detection function (more comprehensive)
  const containsUrl = (text: string): boolean => {
    // Check for common URL patterns including those without http/https
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][-a-zA-Z0-9]+\.[a-zA-Z0-9]{2,}(\/[^\s]*)?)/gi;
    return urlRegex.test(text);
  };
  
  // Function to load more comments
  const handleLoadMoreComments = async () => {
    if (!post || isLoadingMoreComments) return;
    
    setIsLoadingMoreComments(true);
    
    try {
      const nextPage = commentPage + 1;
      const response = await apiRequest<{ status: string; data: Comment[]; total: number; page: number; pages: number }>(
        `/blogs/${post._id}/comments?page=${nextPage}&limit=5`, 
        { requireAuth: false }
      );
      
      // Append new comments to existing ones
      setComments(prevComments => [...prevComments, ...response.data]);
      setCommentPage(nextPage);
      setHasMoreComments(nextPage < response.pages);
    } catch (error) {
      console.error('Error loading more comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more comments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMoreComments(false);
    }
  };
  
  // Handle submitting a comment
  const handleSubmitComment = async () => {
    // Reset any previous validation errors
    let hasError = false;
    
    // Validate required fields
    if (!commentText.trim() || !commentName.trim() || !commentEmail.trim() || !post) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate email format
    if (!isValidEmail(commentEmail.trim())) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    
    // Check for URLs in the comment text
    if (containsUrl(commentText)) {
      toast({
        title: 'Links not allowed',
        description: 'Please remove any URLs or web addresses from your comment',
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      // Call the API to post the comment
      const submitResponse = await apiRequest(`/blogs/${post._id}/comments`, {
        method: 'POST',
        body: {
          name: commentName,
          email: commentEmail,
          text: commentText
        },
        requireAuth: false
      });
      
      // Clear the form
      setCommentText('');
      setCommentName('');
      setCommentEmail('');
      
      // Refresh comments (reset to first page)
      const commentsResponse = await apiRequest<{ status: string; data: Comment[]; total: number; page: number; pages: number }>(
        `/blogs/${post._id}/comments?limit=5`, 
        { requireAuth: false }
      );
      
      setComments(commentsResponse.data);
      setCommentCount(commentsResponse.total);
      setCommentPage(1);
      setHasMoreComments(commentsResponse.pages > 1);
      
      // Show success message
      toast({
        title: 'Comment submitted',
        description: post.requireCommentApproval ? 
          'Your comment has been submitted and is awaiting approval.' :
          'Your comment has been posted successfully.',
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      
      // Display specific validation error messages from the API
      let errorMessage = 'Failed to post your comment. Please try again.';
      
      if (error.validation && error.message) {
        // If it's a validation error, show the specific message
        errorMessage = error.message;
        
        // Highlight the specific field with error if possible
        if (error.message.toLowerCase().includes('email')) {
          toast({
            title: 'Invalid Email',
            description: errorMessage,
            variant: 'destructive',
            duration: 5000,
          });
          return;
        } else if (error.message.toLowerCase().includes('link') || error.message.toLowerCase().includes('url')) {
          toast({
            title: 'Links Not Allowed',
            description: errorMessage,
            variant: 'destructive',
            duration: 5000,
          });
          return;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Format date
  const formatCommentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Calculate the difference in milliseconds
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      // Convert to different units
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      // Format based on how recent the comment is
      if (diffSecs < 60) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else {
        // For older comments, show the actual date
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
          <div className="h-6 bg-muted rounded w-2/3 mx-auto"></div>
          <div className="h-64 bg-muted rounded max-w-3xl mx-auto mt-8"></div>
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
        <p className="text-muted-foreground mt-8">Loading article...</p>
      </div>
    )
  }
  
  // Show error state
  if (error || !post) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted/20 max-w-md mx-auto rounded-xl p-8 border border-border">
          <h1 className="text-3xl font-bold mb-6">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    )
  }
  
  // Add a shareOnSocial function
  const shareOnSocial = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = post?.title || 'Check out this article';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'instagram':
        // Instagram doesn't have a direct share URL, so we'll copy the link instead
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied!",
          description: "Share this link on Instagram.",
          duration: 2000,
        });
        return;
      default:
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <>
      {post && (
        <DynamicMeta 
          title={post.metaTitle || `${post.title} | Web Tools Blog`} 
          description={post.metaDescription || post.excerpt} 
          keywords={post.metaKeywords ? post.metaKeywords.join(', ') : post.tags.join(', ')}
          ogImage={post.ogImage || post.featuredImage}
          ogType="article"
          canonicalUrl={post.canonicalUrl || (typeof window !== 'undefined' && post.slug ? `${window.location.origin}/blog/${post.slug}` : undefined)}
        />
      )}
      
      {/* Reading progress bar */}
      <div 
        className="fixed top-0 left-0 z-50 h-1 bg-primary transition-all duration-300 ease-out"
        style={{ width: `${readingProgress}%` }}
      />
      
      {/* Back button and action buttons */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="group">
          <Link href="/blog">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Articles
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handleLike}
            disabled={loading || liked}
            title={liked ? "You've already liked this article" : "Like this article"}
          >
            <Heart className={cn("h-4 w-4 transition-all", liked ? "fill-red-500 text-red-500" : "")} />
            <span>{likeCount}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={copyToClipboard}
          >
            <Share className="h-4 w-4" />
            <span className="sr-only md:not-sr-only">Share</span>
          </Button>
        </div>
      </div>
      
      {/* Category tag */}
      <div className="mb-4">
        <Badge variant="outline" className="text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10">
          {post.category}
        </Badge>
      </div>
      
      {/* Header */}
      <div className="mb-10 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">{post.title}</h1>
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium">
          {post.excerpt}
        </p>
        
        {/* Featured image with optimized loading */}
        <div className="mb-12 relative overflow-hidden rounded-2xl">
          <div className="aspect-[16/9] w-full transform transition-transform duration-700 hover:scale-105 bg-muted/50">
            {post.featuredImage ? (
              <img 
                src={post.featuredImage} 
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Author and metadata */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-3 border-2 border-background ring-2 ring-primary/10">
              {/* Use AvatarImage if available */}
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getAuthorInitials(post.author)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-base">{getAuthorName(post.author)}</div>
              <div className="text-xs text-muted-foreground">Author</div>
            </div>
          </div>
          
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
              {post.readingTime || '5 min read'}
            </div>
            <div className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-1.5 text-muted-foreground/70" />
              {post.views} views
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories and Latest Posts - Mobile View */}
      <div className="lg:hidden mb-8">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Link href={`/blog?category=${encodeURIComponent(category)}`} key={category}>
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 rounded-full text-sm font-normal hover:bg-primary/10 transition-colors"
                  >
                    {category}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Latest Posts */}
        {latestPosts.length > 0 && latestPosts.some(p => p._id !== post?._id) && (
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Latest Posts
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {latestPosts
                    .filter(p => p._id !== post?._id)
                    .map(latest => (
                      <div key={latest._id} className="group">
                        <Link 
                          href={`/blog/${latest.slug || latest._id}`}
                          className="block py-1 group-hover:text-primary transition-colors"
                        >
                          <div className="text-sm font-medium line-clamp-2 mb-1">
                            {latest.title}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            {new Date(latest.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </Link>
                        {latestPosts.indexOf(latest) < latestPosts.filter(p => p._id !== post?._id).length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 mb-12">
        {/* Table of contents - Mobile */}
        <div className="lg:hidden sticky top-16 z-30 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2 mb-2 w-full justify-between backdrop-blur-sm bg-background/80"
            onClick={() => setIsTocOpen(!isTocOpen)}
          >
            <span className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              Table of Contents
            </span>
            <span className={`transition-transform duration-300 ${isTocOpen ? 'rotate-180' : ''}`}>
              <ChevronUp className="h-4 w-4" />
            </span>
          </Button>
          
          {isTocOpen && (
            <Card className="mt-1 animate-in slide-in-from-top-4 fade-in duration-300 shadow-lg">
              <CardContent className="p-4">
                <nav className="toc text-sm">
                  <ul className="space-y-2">
                    {headings.map((heading) => (
                      <li 
                        key={heading.id} 
                        style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                      >
                        <a
                          href={`#${heading.id}`}
                          className={cn(
                            "block hover:text-primary transition-colors py-1",
                            activeHeading === heading.id ? "text-primary font-medium" : "text-muted-foreground"
                          )}
                          onClick={() => setIsTocOpen(false)}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main article */}
        <article ref={articleRef} className="lg:col-span-8 prose prose-lg dark:prose-invert max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            className="prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-headings:scroll-mt-20 prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:leading-relaxed prose-headings:leading-tight prose-pre:bg-muted/50 prose-pre:backdrop-blur-sm prose-code:text-sm prose-code:bg-muted/80 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-blockquote:border-l-primary/50 prose-blockquote:bg-muted/30 prose-blockquote:px-6 prose-blockquote:py-1 prose-blockquote:italic"
          />
          
          {/* Tags below article */}
          {post.tags && post.tags.length > 0 && (
            <div className="not-prose mt-12">
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={`tag-${tag}-${index}`} variant="outline" className="px-3 py-1 rounded-full text-sm font-normal hover:bg-primary/10 transition-colors">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Like and share section */}
          <div className="not-prose mt-12 border-t pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant={liked ? "default" : "outline"} 
                size="sm" 
                className={cn(
                  "gap-2 transition-all rounded-full",
                  liked ? "bg-primary/90 hover:bg-primary" : ""
                )}
                onClick={handleLike}
                disabled={loading || liked}
                title={liked ? "You've already liked this article" : "Like this article"}
              >
                <Heart className={cn("h-4 w-4 transition-all", liked ? "fill-primary-foreground" : "")} />
                {liked ? "Liked" : "Like"} 
                <span className="font-normal">({likeCount})</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 rounded-full"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="h-4 w-4" />
                Comments <span className="font-normal">({commentCount})</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="flex items-center gap-1 rounded-full">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full"
                  onClick={() => shareOnSocial('twitter')}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full"
                  onClick={() => shareOnSocial('facebook')}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full"
                  onClick={() => shareOnSocial('linkedin')}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full"
                  onClick={() => shareOnSocial('whatsapp')}
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full"
                  onClick={() => shareOnSocial('instagram')}
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Add this after the Like & Share section in the article component */}
          {showComments && (
            <div className="not-prose mt-8 border-t pt-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({commentCount})
              </h3>
              
              {/* Comment form */}
              <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commentName">Name *</Label>
                    <Input
                      id="commentName"
                      placeholder="Your name"
                      className="mt-1"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="commentEmail">Email * <span className="text-xs text-muted-foreground">(will not be displayed)</span></Label>
                    <Input
                      id="commentEmail"
                      type="email"
                      placeholder="Your email address"
                      className="mt-1"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      onBlur={(e) => {
                        if (e.target.value && !isValidEmail(e.target.value)) {
                          toast({
                            title: 'Invalid email format',
                            description: 'Please enter a valid email address',
                            variant: 'destructive',
                          });
                        }
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="commentText">Comment * <span className="text-xs text-muted-foreground">(no links or web addresses allowed)</span></Label>
                  <Textarea
                    id="commentText"
                    placeholder="Write your comment here..."
                    className="resize-none mt-1 h-24"
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      // Check for URLs as the user types and show a warning
                      if (containsUrl(e.target.value) && e.target.value !== commentText) {
                        toast({
                          title: 'Links detected',
                          description: 'Please remove any URLs or web addresses from your comment',
                          variant: 'destructive',
                        });
                      }
                    }}
                    required
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={!commentText.trim() || !commentName.trim() || !commentEmail.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
              
              {/* Comments list */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  <>
                    {comments.map(comment => (
                      <div key={comment._id} className="flex gap-4 border-b pb-6">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-muted">
                            {comment.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {comment.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {formatCommentDate(comment.createdAt)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreComments && (
                      <div className="flex justify-center mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleLoadMoreComments}
                          disabled={isLoadingMoreComments}
                        >
                          {isLoadingMoreComments ? (
                            <>
                              <span className="mr-2">Loading...</span>
                              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </>
                          ) : (
                            <>
                              Load More Comments
                              <span className="ml-1 text-xs">({commentCount - comments.length} more)</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </article>
        
        {/* Sidebar */}
        <aside className="lg:col-span-4 hidden lg:block">
          <div className="sticky top-20 space-y-8">
            {/* Table of contents - Desktop */}
            {headings.length > 0 && (
              <Card className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Table of Contents
                  </h3>
                  <nav className="toc text-sm">
                    <ul className="space-y-2.5">
                      {headings.map((heading) => (
                        <li 
                          key={heading.id}
                          className="border-l-2 pl-3 transition-all"
                          style={{
                            paddingLeft: `${(heading.level - 1) * 0.75 + 0.75}rem`,
                            borderLeftColor: activeHeading === heading.id ? 'var(--primary)' : 'transparent'
                          }}
                        >
                          <a
                            href={`#${heading.id}`}
                            className={cn(
                              "block hover:text-primary transition-colors py-1",
                              activeHeading === heading.id ? "text-primary font-medium" : "text-muted-foreground"
                            )}
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </CardContent>
              </Card>
            )}
            
            {/* Quick share */}
            <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share this article
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => shareOnSocial('twitter')}
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => shareOnSocial('facebook')}
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => shareOnSocial('linkedin')}
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => shareOnSocial('whatsapp')}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => shareOnSocial('instagram')}
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                </div>
                <Separator className="my-4" />
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                  Copy URL
                </Button>
              </CardContent>
            </Card>
            
            {/* Categories section */}
            {categories.length > 0 && (
              <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Link href={`/blog?category=${encodeURIComponent(category)}`} key={category}>
                        <Badge 
                          variant="outline" 
                          className="px-3 py-1 rounded-full text-sm font-normal hover:bg-primary/10 transition-colors"
                        >
                          {category}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Latest posts section */}
            {latestPosts.length > 0 && latestPosts.some(p => p._id !== post?._id) && (
              <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Latest Posts
                  </h3>
                  <div className="space-y-4">
                    {latestPosts
                      .filter(p => p._id !== post?._id)
                      .map(latest => (
                        <div key={latest._id} className="group">
                          <Link 
                            href={`/blog/${latest.slug || latest._id}`}
                            className="block py-2 group-hover:text-primary transition-colors"
                          >
                            <div className="text-sm font-medium line-clamp-2 mb-1">
                              {latest.title}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {new Date(latest.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                              <Separator orientation="vertical" className="h-3 mx-2" />
                              <Clock className="h-3 w-3 mr-1" />
                              {latest.readingTime || '5 min read'}
                            </div>
                          </Link>
                          {latestPosts.filter(p => p._id !== post?._id).indexOf(latest) < 
                            latestPosts.filter(p => p._id !== post?._id).length - 1 && (
                            <Separator className="mt-2" />
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
          </div>
        </aside>
      </div>
      
      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <div className="border-t pt-12">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span className="inline-block h-5 w-1 bg-primary rounded-full mr-1"></span>
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map(post => (
              <Card 
                key={post._id} 
                className="overflow-hidden flex flex-col h-full border group hover:shadow-md transition-all duration-300"
              >
                <div className="h-48 overflow-hidden bg-muted/50">
                  {post.featuredImage ? (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback if image fails to load
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <span className="text-muted-foreground">No image available</span>
                    </div>
                  )}
                </div>
                <CardContent className="py-6 flex-grow">
                  <div className="space-y-3">
                    <Badge variant="outline" className="bg-primary/5 text-primary text-xs mb-2">
                      {post.category}
                    </Badge>
                    <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/blog/${post.slug || post._id}`}>
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getAuthorInitials(post.author)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="mr-2">{getAuthorName(post.author)}</span>
                    <Separator orientation="vertical" className="h-3 mx-2" />
                    <Clock className="h-3 w-3 mr-1" />
                    {post.readingTime || '5 min read'}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 animate-in fade-in duration-300"
          variant="secondary"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </>
  )
} 