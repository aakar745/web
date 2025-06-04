import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiRequest } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'
import { BlogPost, HeadingInfo } from './types'
import { getRelatedPosts, extractHeadings } from './utils'

export function useBlogPostData(blogId: string, initialPost?: BlogPost | null) {
  // Always use initialPost if provided, never update it
  const [post, setPost] = useState<BlogPost | null>(initialPost || null)
  const [processedContent, setProcessedContent] = useState<string>('')
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(!initialPost) // Don't show loading if we have initial post
  const [error, setError] = useState(false)
  const [headings, setHeadings] = useState<HeadingInfo[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Sidebar data
  const [categories, setCategories] = useState<string[]>([])
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([])
  
  const router = useRouter()

  // Track hydration to prevent server/client mismatches
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Like functionality
  const handleLike = async () => {
    if (!post || liked) return
    
    try {
      await apiRequest(`/blogs/${post._id}/like`, {
        method: 'POST',
        noRedirect: true
      })
      
      setLiked(true)
      setLikeCount(prev => prev + 1)
      
      toast({
        title: 'Thank you!',
        description: 'You liked this article.',
        duration: 2000,
      })
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  // Fetch blog post (only if no initialPost is provided)
  useEffect(() => {
    const fetchBlogPost = async () => {
      // Skip fetching if we have initialPost
      if (initialPost) return
      
      try {
        setLoading(true)
        setError(false)
        
        // First try to fetch by slug (if it doesn't look like a MongoDB ID)
        const isSlug = !blogId.match(/^[0-9a-fA-F]{24}$/)
        
        if (isSlug) {
          try {
            const response = await apiRequest<{
              status: string;
              data: BlogPost;
            }>(`/blogs/by-slug/${encodeURIComponent(blogId)}`, { 
              noRedirect: true 
            });
            
            if (response.status === 'success') {
              setPost(response.data);
              
              // Process headings and update separate processed content state
              const { headingsData, updatedContent } = extractHeadings(response.data.content);
              setHeadings(headingsData);
              setProcessedContent(updatedContent); // Use separate state for processed content
              
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
              
              return; // Exit early if found by slug
            }
          } catch (slugError) {
            // Not found by slug, will try by ID
          }
        }
        
        // If not found by slug or it's a MongoDB ID, try to fetch by ID
        const response = await apiRequest<{
          status: string;
          data: BlogPost;
        }>(`/blogs/${blogId}`, { 
          noRedirect: true 
        });
        
        setPost(response.data);
        
        // Process headings and update separate processed content state
        const { headingsData, updatedContent } = extractHeadings(response.data.content);
        setHeadings(headingsData);
        setProcessedContent(updatedContent); // Use separate state for processed content
        
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
    
    // Only fetch if we don't have initial data and hydration is complete
    if (blogId && !initialPost && isHydrated) {
      fetchBlogPost();
    }
  }, [blogId, router, initialPost, isHydrated]);

  // Process initial post data if provided (extract headings, fetch related posts, etc.)
  useEffect(() => {
    const processInitialData = async () => {
      if (!initialPost) return;
      
      try {
        // Process headings from initial post content
        const { headingsData, updatedContent } = extractHeadings(initialPost.content);
        setHeadings(headingsData);
        setProcessedContent(updatedContent); // Use separate state for processed content
        
        // Set initial like count from the post data
        setLikeCount(initialPost.likes || 0);
        
        // Check like status only after hydration to prevent hydration mismatch
        if (isHydrated) {
          const likeStatusResponse = await apiRequest<{
            status: string;
            data: { hasLiked: boolean; likes: number };
          }>(`/blogs/${initialPost._id}/like`, {
            method: 'GET',
            noRedirect: true
          });
          
          if (likeStatusResponse.status === 'success') {
            setLiked(likeStatusResponse.data.hasLiked);
            setLikeCount(likeStatusResponse.data.likes);
          }
        }
        
        // Fetch related posts only after hydration to prevent hydration mismatch
        if (initialPost.tags && initialPost.tags.length > 0 && isHydrated) {
          const allPostsResponse = await apiRequest<{
            status: string;
            data: BlogPost[];
          }>('/blogs', { 
            noRedirect: true 
          });
          
          if (allPostsResponse.data) {
            const related = getRelatedPosts(initialPost, allPostsResponse.data);
            setRelatedPosts(related);
          }
        }
      } catch (error) {
        console.error('Error processing initial post data:', error);
      }
    };
    
    // Process initial data immediately when component mounts
    processInitialData();
  }, [initialPost, isHydrated]);

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

  return {
    // Blog post data
    post,
    processedContent,
    relatedPosts,
    loading,
    error,
    headings,
    
    // Like functionality
    liked,
    likeCount,
    handleLike,
    
    // Sidebar data
    categories,
    latestPosts
  }
} 