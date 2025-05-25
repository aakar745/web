'use client'

import { useEffect } from 'react'

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
    
    // Update meta tags
    updateMetaTag('description', description);
    if (keywords) updateMetaTag('keywords', keywords);
    
    // Update Open Graph and Twitter tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    if (ogImage) updateMetaTag('og:image', ogImage);
    updateMetaTag('og:type', ogType);
    
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (ogImage) updateMetaTag('twitter:image', ogImage);
    
    // Handle canonical URL
    if (canonicalUrl) {
      let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      
      if (canonicalElement) {
        canonicalElement.href = canonicalUrl;
      } else {
        canonicalElement = document.createElement('link');
        canonicalElement.rel = 'canonical';
        canonicalElement.href = canonicalUrl;
        document.head.appendChild(canonicalElement);
      }
    }
    
    // No clean-up function needed since we're not adding anything temporary
  }, [title, description, keywords, ogImage, ogType, canonicalUrl]);
  
  const updateMetaTag = (name: string, content: string) => {
    try {
      // First, look for an existing tag
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      
      // For Open Graph tags, they use property instead of name
      if (!meta && name.startsWith('og:')) {
        meta = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement;
      }
      
      // For Twitter tags, they use name
      if (!meta && name.startsWith('twitter:')) {
        meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      }
      
      if (meta) {
        // Update existing tag
        meta.content = content;
      } else {
        // Create a new meta tag
        meta = document.createElement('meta');
        
        if (name.startsWith('og:')) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        
        meta.content = content;
        document.head.appendChild(meta);
      }
    } catch (error) {
      console.error(`Error updating meta tag ${name}:`, error);
    }
  };
  
  return null; // This component doesn't render anything
}; 