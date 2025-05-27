'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram, 
  Mail,
  PhoneCall,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { ProcessingModeIndicator } from '@/components/ui/ProcessingModeIndicator'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)
  const toggleToolsDropdown = () => setIsToolsDropdownOpen(!isToolsDropdownOpen)

  const isActiveLink = (path: string) => {
    return pathname === path
  }
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render theme-dependent UI until mounted on client
  const renderThemeChanger = mounted

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">ToolsCandy</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
              <div className="relative group">
                <button 
                  onClick={toggleToolsDropdown}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span>Image Tools</span>
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-popover border border-border overflow-hidden transition-all duration-200 ease-in-out origin-top-left ${isToolsDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className="py-1">
                    <Link
                      href="/image/compress"
                      className={`block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${isActiveLink('/image/compress') ? 'bg-accent/50 text-primary' : ''}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      Compress
                    </Link>
                    <Link
                      href="/image/resize"
                      className={`block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${isActiveLink('/image/resize') ? 'bg-accent/50 text-primary' : ''}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      Resize
                    </Link>
                    <Link
                      href="/image/convert"
                      className={`block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${isActiveLink('/image/convert') ? 'bg-accent/50 text-primary' : ''}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      Convert
                    </Link>
                    <Link
                      href="/image/crop"
                      className={`block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${isActiveLink('/image/crop') ? 'bg-accent/50 text-primary' : ''}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      Crop
                    </Link>
                  </div>
                </div>
              </div>
              
              <Link
                href="/blog"
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${isActiveLink('/blog') ? 'bg-accent/50 text-primary' : ''}`}
              >
                Latest News
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>

            {/* CTA Button - always visible */}
            <div className="hidden md:flex items-center space-x-4">
              <ProcessingModeIndicator />
              
              {/* Theme toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full border-0 bg-secondary/30 hover:bg-secondary/50">
                    {renderThemeChanger ? (
                      theme === 'dark' ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer rounded-lg flex items-center gap-2 py-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer rounded-lg flex items-center gap-2 py-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer rounded-lg flex items-center gap-2 py-2">
                    <div className="h-4 w-4 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full border-2"></div>
                    </div>
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <Link href="/" className="font-medium">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 border-t">
            <div className="space-y-1 px-3">
              <button
                onClick={toggleToolsDropdown}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <span>Image Tools</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`pl-4 ${isToolsDropdownOpen ? 'block' : 'hidden'}`}>
                <Link
                  href="/image/compress"
                  className={`block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActiveLink('/image/compress') ? 'bg-accent/50 text-primary' : ''}`}
                  onClick={closeMenu}
                >
                  Compress
                </Link>
                <Link
                  href="/image/resize"
                  className={`block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActiveLink('/image/resize') ? 'bg-accent/50 text-primary' : ''}`}
                  onClick={closeMenu}
                >
                  Resize
                </Link>
                <Link
                  href="/image/convert"
                  className={`block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActiveLink('/image/convert') ? 'bg-accent/50 text-primary' : ''}`}
                  onClick={closeMenu}
                >
                  Convert
                </Link>
                <Link
                  href="/image/crop"
                  className={`block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActiveLink('/image/crop') ? 'bg-accent/50 text-primary' : ''}`}
                  onClick={closeMenu}
                >
                  Crop
                </Link>
              </div>
            </div>
            
            <Link
              href="/blog"
              className={`block px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActiveLink('/blog') ? 'bg-accent/50 text-primary' : ''}`}
              onClick={closeMenu}
            >
              Latest News
            </Link>
            
            <div className="mt-4 px-3 space-y-3">
              {/* Theme toggle for mobile */}
              <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                <span>Theme</span>
                {renderThemeChanger ? (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-full ${theme === 'light' ? 'bg-accent text-accent-foreground' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-accent text-accent-foreground' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-full ${theme === 'system' ? 'bg-accent text-accent-foreground' : ''}`}
                      onClick={() => setTheme('system')}
                    >
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full border-2"></div>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Sun className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Moon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full border-2"></div>
                      </div>
                    </Button>
                  </div>
                )}
              </div>
              
              <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/" className="font-medium" onClick={closeMenu}>
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {pathname === '/' ? (
          <>{children}</>
        ) : (
          <div className="container py-6 md:py-10">
            {children}
          </div>
        )}
      </main>
      <footer className="border-t bg-background">
        <div className="container py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About ToolsCandy</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ToolsCandy provides powerful, free image processing tools that work right in your browser. Optimize, resize, convert, and crop images with complete privacy.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Image Tools</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/image/compress" className="text-muted-foreground hover:text-primary transition-colors">
                    Image Compression
                  </Link>
                </li>
                <li>
                  <Link href="/image/resize" className="text-muted-foreground hover:text-primary transition-colors">
                    Image Resize
                  </Link>
                </li>
                <li>
                  <Link href="/image/convert" className="text-muted-foreground hover:text-primary transition-colors">
                    Format Conversion
                  </Link>
                </li>
                <li>
                  <Link href="/image/crop" className="text-muted-foreground hover:text-primary transition-colors">
                    Image Crop
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>hello@toolscandy.com</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>support@toolscandy.com</span>
                </li>
              </ul>
              <form className="mt-4 space-y-3">
                <input 
                  type="email" 
                  placeholder="Subscribe to our newsletter" 
                  className="w-full rounded-md border border-input px-3 py-2 text-sm focus:border-primary"
                />
                <Button size="sm" className="w-full">Subscribe</Button>
              </form>
            </div>
          </div>
          
          <div className="pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ToolsCandy. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/disclaimer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 