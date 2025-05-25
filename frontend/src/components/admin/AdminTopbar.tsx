'use client'

import React from 'react'
import { Bell, Sun, Moon, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Badge } from "@/components/ui/badge"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminTopbarProps {
  user: User
}

export function AdminTopbar({ user }: AdminTopbarProps) {
  const { setTheme, theme } = useTheme()
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="h-16 border-b flex items-center justify-between px-6 bg-background">
      <div className="flex-1">
        <h1 className="font-medium text-lg hidden md:block">Welcome, {user?.name || 'Admin'}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-0 bg-secondary/30 hover:bg-secondary/50">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl p-2">
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
        
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full border-0 bg-secondary/30 hover:bg-secondary/50 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full border-2 border-background"></span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Notifications</h3>
              <Badge variant="outline" className="ml-2 bg-primary/10 hover:bg-primary/20 text-primary">
                3 New
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <div className="space-y-3 mt-2">
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New blog comment</p>
                  <p className="text-xs text-muted-foreground mt-1">Someone commented on your latest blog post</p>
                  <p className="text-xs text-muted-foreground mt-1">2 min ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New user registration</p>
                  <p className="text-xs text-muted-foreground mt-1">A new user has registered to the platform</p>
                  <p className="text-xs text-muted-foreground mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator className="my-2" />
            <div className="text-center">
              <Button variant="ghost" size="sm" className="text-sm w-full justify-center rounded-lg">
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User avatar & dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-full h-10 hover:bg-secondary/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary ring-2 ring-background">
                <span className="text-xs font-medium">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'AU'}
                </span>
              </div>
              <div className="text-sm hidden md:block">
                <div className="font-medium">{user?.name || 'Admin User'}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'admin@example.com'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer rounded-lg flex items-center gap-2 py-2">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer rounded-lg flex items-center gap-2 py-2">
              Admin Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer rounded-lg flex items-center gap-2 text-red-500 py-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 