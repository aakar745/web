'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram, 
  Mail,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Zap,
  Maximize,
  RefreshCw,
  Crop,
  ImageIcon
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
// import { ProcessingModeIndicator } from '@/components/ui/ProcessingModeIndicator'

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
              <Link href="/" className="flex items-center space-x-2 group" onClick={closeMenu}>
                {/* Candy Logo Icon */}
                <motion.div 
                  className="relative"
                  whileHover={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: 1.05
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 shadow-lg flex items-center justify-center relative overflow-hidden">
                    {/* Candy Shine Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-full"
                      animate={{ 
                        rotate: [0, 360] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    />
                    {/* Lollipop Icon */}
                    <span className="text-white text-sm sm:text-base font-bold relative z-10">🍭</span>
                  </div>
                  
                  {/* Sparkle Effects */}
                  <motion.div
                    className="absolute -top-1 -right-1 text-yellow-400"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: 0 
                    }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -left-1 text-pink-400 text-xs"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, -180, -360]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: 1 
                    }}
                  >
                    ✨
                  </motion.div>
                </motion.div>
                
                {/* Brand Text */}
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-1">
                  <motion.span 
                    className="font-bold text-lg sm:text-xl bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:via-purple-500 group-hover:to-violet-500 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Tools
                  </motion.span>
                  <motion.span 
                    className="font-bold text-lg sm:text-xl bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:via-pink-400 group-hover:to-rose-400 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Candy
                  </motion.span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
              <div className="relative group">
                <motion.button 
                  onClick={toggleToolsDropdown}
                  className="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-800/50 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300 shadow-sm hover:shadow-md"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ImageIcon className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent font-semibold">Image Tools</span>
                  <ChevronDown className={`ml-2 h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                
                <motion.div 
                  className={`absolute left-0 mt-3 w-64 rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-xl ${isToolsDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
                  initial={false}
                  animate={isToolsDropdownOpen ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">
                      Choose Your Tool
                    </div>
                    
                    <Link
                      href="/image/compress"
                      className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActiveLink('/image/compress') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white mr-3 group-hover:scale-110 transition-transform duration-200">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">Compress</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Reduce file size</div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/image/resize"
                      className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActiveLink('/image/resize') ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white mr-3 group-hover:scale-110 transition-transform duration-200">
                        <Maximize className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">Resize</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Change dimensions</div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/image/convert"
                      className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActiveLink('/image/convert') ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white mr-3 group-hover:scale-110 transition-transform duration-200">
                        <RefreshCw className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">Convert</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Change format</div>
                      </div>
                    </Link>
                    
                    <Link
                      href="/image/crop"
                      className={`group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActiveLink('/image/crop') ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                      onClick={() => {
                        setIsToolsDropdownOpen(false)
                        closeMenu()
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white mr-3 group-hover:scale-110 transition-transform duration-200">
                        <Crop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">Crop</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Trim & cut</div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
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
              {/* <ProcessingModeIndicator /> */}
              
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
              <motion.button
                onClick={toggleToolsDropdown}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-100 dark:border-purple-800/50 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50 transition-all duration-300"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center">
                  <ImageIcon className="w-4 h-4 mr-3 text-purple-600 dark:text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-700 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent font-semibold">Image Tools</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform duration-300 ${isToolsDropdownOpen ? 'rotate-180' : ''}`} />
              </motion.button>
              
              <motion.div 
                className={`overflow-hidden ${isToolsDropdownOpen ? 'max-h-96' : 'max-h-0'}`}
                initial={false}
                animate={isToolsDropdownOpen ? { maxHeight: 384 } : { maxHeight: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="pt-2 pb-1 space-y-1">
                  <Link
                    href="/image/compress"
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ml-2 mr-1 ${isActiveLink('/image/compress') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white mr-3 group-active:scale-95 transition-transform duration-150">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Compress</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Reduce file size</div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/image/resize"
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ml-2 mr-1 ${isActiveLink('/image/resize') ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white mr-3 group-active:scale-95 transition-transform duration-150">
                      <Maximize className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Resize</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Change dimensions</div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/image/convert"
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ml-2 mr-1 ${isActiveLink('/image/convert') ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white mr-3 group-active:scale-95 transition-transform duration-150">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Convert</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Change format</div>
                    </div>
                  </Link>
                  
                  <Link
                    href="/image/crop"
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ml-2 mr-1 ${isActiveLink('/image/crop') ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800' : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-750 text-gray-700 dark:text-gray-300'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white mr-3 group-active:scale-95 transition-transform duration-150">
                      <Crop className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Crop</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Trim & cut</div>
                    </div>
                  </Link>
                </div>
              </motion.div>
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
              <div className="flex items-center space-x-2 group mb-4">
                {/* Candy Logo Icon - Footer Version */}
                <motion.div 
                  className="relative"
                  whileHover={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: 1.05
                  }}
                  transition={{ 
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 shadow-lg flex items-center justify-center relative overflow-hidden">
                    {/* Candy Shine Effect */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-full"
                      animate={{ 
                        rotate: [0, 360] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    />
                    {/* Lollipop Icon */}
                    <span className="text-white text-xs font-bold relative z-10">🍭</span>
                  </div>
                  
                  {/* Sparkle Effects */}
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 text-yellow-400 text-xs"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: 0 
                    }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-0.5 -left-0.5 text-pink-400 text-xs"
                    animate={{ 
                      scale: [0, 1, 0],
                      rotate: [0, -180, -360]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: 1 
                    }}
                  >
                    ✨
                  </motion.div>
                </motion.div>
                
                {/* Brand Text */}
                <div className="flex items-baseline space-x-1">
                  <motion.span 
                    className="font-bold text-base bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:from-pink-500 group-hover:via-purple-500 group-hover:to-violet-500 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Tools
                  </motion.span>
                  <motion.span 
                    className="font-bold text-base bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent group-hover:from-orange-400 group-hover:via-pink-400 group-hover:to-rose-400 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                  >
                    Candy
                  </motion.span>
                </div>
              </div>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()}</span>
              
              {/* Small Footer Logo */}
              <div className="flex items-center space-x-1 group">
                <motion.div 
                  className="relative"
                  whileHover={{ 
                    rotate: [0, -5, 5, 0],
                    scale: 1.05
                  }}
                  transition={{ 
                    duration: 0.4,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-violet-500 shadow-sm flex items-center justify-center relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-full"
                      animate={{ 
                        rotate: [0, 360] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                    />
                    <span className="text-white text-xs relative z-10">🍭</span>
                  </div>
                </motion.div>
                
                <div className="flex items-baseline">
                  <motion.span 
                    className="text-xs font-medium bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                  >
                    Tools
                  </motion.span>
                  <motion.span 
                    className="text-xs font-medium bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                  >
                    Candy
                  </motion.span>
                </div>
              </div>
              
              <span>. All rights reserved.</span>
            </div>
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