'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Images, 
  Settings, 
  Users, 
  BarChart3, 
  ShieldAlert,
  LogOut
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Redirect to login page if user is not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`)
    } else if (!isLoading && user && user.role !== 'admin') {
      router.push('/')
    }
  }, [isLoading, user, router, pathname])
  
  // Handle sidebar collapse state
  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
  }
  
  // If loading session, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          <div className="w-64 border-r">
            <Skeleton className="h-full" />
          </div>
          <div className="flex-1 flex flex-col">
            <Skeleton className="h-16 w-full" />
            <div className="flex-1 p-6">
              <Skeleton className="h-[calc(100vh-6rem)] w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // If authenticated and session loaded, show admin panel
  if (user && user.role === 'admin') {
    const mainNav = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        title: "Blogs",
        href: "/dashboard/blogs",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Comments",
        href: "/dashboard/comments",
        icon: <MessageSquare className="h-5 w-5" />,
      },
      {
        title: "Media",
        href: "/dashboard/media",
        icon: <Images className="h-5 w-5" />,
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Monitoring",
        href: "/dashboard/monitoring",
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ]

    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <div className="fixed h-screen z-30 left-0 border-r">
          <AdminSidebar onToggle={handleSidebarToggle} />
        </div>
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className={`fixed top-0 right-0 z-20 transition-all duration-300 ${isSidebarCollapsed ? 'left-20' : 'left-64'}`}>
            <AdminTopbar user={user} />
          </div>
          <main className="flex-1 p-6 pt-[4.5rem] overflow-y-auto h-screen">
            {children}
          </main>
        </div>
      </div>
    )
  }
  
  // This should not be visible, but adding as a fallback
  return null
} 