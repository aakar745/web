'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  Home,
  ImageIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
  Search,
  Code
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  color: string
}

interface AdminSidebarProps {
  onToggle?: (collapsed: boolean) => void
}

export function AdminSidebar({ onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed
    setIsCollapsed(newCollapsedState)
    if (onToggle) {
      onToggle(newCollapsedState)
    }
  }

  useEffect(() => {
    if (onToggle) {
      onToggle(isCollapsed)
    }
  }, [isCollapsed, onToggle])

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      title: 'Blogs',
      href: '/dashboard/blogs',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    },
    {
      title: 'Comments',
      href: '/dashboard/comments',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      title: 'Users',
      href: '/dashboard/users',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      title: 'Image Tools',
      href: '/dashboard/image-tools',
      icon: <ImageIcon className="h-5 w-5" />,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
    },
    {
      title: 'Monitoring',
      href: '/dashboard/monitoring',
      icon: <Activity className="h-5 w-5" />,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    },
    {
      title: 'SEO',
      href: '/dashboard/seo',
      icon: <Search className="h-5 w-5" />,
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
    },
    {
      title: 'Scripts',
      href: '/dashboard/scripts',
      icon: <Code className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
    }
  ]

  return (
    <motion.div 
      className={cn(
        "bg-card h-screen border-r flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="h-16 border-b flex items-center px-6 justify-between">
        {!isCollapsed && <h1 className="font-bold text-xl">ToolsCandy</h1>}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={cn(
            "rounded-full hover:bg-primary/10",
            isCollapsed ? "ml-auto mr-auto" : "ml-auto"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  pathname === item.href
                    ? `${item.color} font-medium` 
                    : "text-muted-foreground hover:bg-primary/5",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-md",
                  pathname === item.href ? item.color : "bg-background"
                )}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    className: cn(
                      "h-5 w-5",
                      pathname === item.href 
                        ? "" 
                        : "text-muted-foreground"
                    )
                  })}
                </div>
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className={cn(
        "border-t mt-auto",
        isCollapsed ? "p-3" : "p-4"
      )}>
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 transition-all duration-200",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <div className="p-1.5 rounded-md bg-background">
                <Home className="h-5 w-5 text-muted-foreground" />
              </div>
              {!isCollapsed && <span>Back to Website</span>}
            </Link>
          </li>
          <li>
            <button
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 transition-all duration-200",
                isCollapsed ? "justify-center" : ""
              )}
              onClick={handleLogout}
            >
              <div className="p-1.5 rounded-md bg-background">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </div>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </li>
        </ul>
      </div>
    </motion.div>
  )
} 