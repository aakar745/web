'use client'

import { useEffect } from 'react'
import { getProxiedImageUrl } from '@/lib/imageProxy'

interface MetaProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonicalUrl?: string;
}

/**
 * A component that dynamically updates meta tags for SEO
 * Use this in client components where Next.js metadata API isn't available
 */
export const DynamicMeta = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  ogType = 'website',
  canonicalUrl
}: MetaProps) => {
  useEffect(() => {
    // Skip execution during SSR
    if (typeof window === 'undefined') return;
    
    // Handle title element - safer approach to avoid DOM errors
    try {
      // Don't try to remove existing titles, just update or add one
      let titleElement = document.head.querySelector('title');
      
      if (titleElement) {
        // Update existing title
        titleElement.textContent = title;
      } else {
        // Create new title element if none exists
        titleElement = document.createElement('title');
        titleElement.textContent = title;
        document.head.appendChild(titleElement);
      }
    } catch (error) {
      console.error('Error updating title element:', error);
    }
    
    // Helper function to update meta tags safely
    const updateMetaTag = (property: string, content: string, attributeName = 'name') => {
      if (!content) return;
      
      try {
        let selector = attributeName === 'property' 
          ? `meta[property="${property}"]`
          : `meta[name="${property}"]`;
        
        let metaTag = document.head.querySelector(selector);
        
        if (metaTag) {
          metaTag.setAttribute('content', content);
        } else {
          metaTag = document.createElement('meta');
          metaTag.setAttribute(attributeName, property);
          metaTag.setAttribute('content', content);
          document.head.appendChild(metaTag);
        }
      } catch (error) {
        console.error(`Error updating meta tag ${property}:`, error);
      }
    };
    
    // Update meta tags
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    
    // Update canonical URL
    if (canonicalUrl) {
      try {
        let linkTag = document.head.querySelector('link[rel="canonical"]');
        if (linkTag) {
          linkTag.setAttribute('href', canonicalUrl);
        } else {
          linkTag = document.createElement('link');
          linkTag.setAttribute('rel', 'canonical');
          linkTag.setAttribute('href', canonicalUrl);
          document.head.appendChild(linkTag);
        }
      } catch (error) {
        console.error('Error updating canonical URL:', error);
      }
    }
    
    // Update Open Graph and Twitter tags with proxied image URLs
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:type', ogType, 'property');
    
    // Convert backend image URL to proxied URL for Open Graph
    if (ogImage) {
      const proxiedImageUrl = getProxiedImageUrl(ogImage);
      if (proxiedImageUrl) {
        updateMetaTag('og:image', proxiedImageUrl, 'property');
        console.log(`[DynamicMeta] Using proxied og:image: ${proxiedImageUrl}`);
      }
    }
    
    // Update Twitter Card tags with proxied image URLs
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    
    // Convert backend image URL to proxied URL for Twitter
    if (ogImage) {
      const proxiedImageUrl = getProxiedImageUrl(ogImage);
      if (proxiedImageUrl) {
        updateMetaTag('twitter:image', proxiedImageUrl);
        console.log(`[DynamicMeta] Using proxied twitter:image: ${proxiedImageUrl}`);
      }
    }
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);
  
  return null; // This component doesn't render anything
}; 