'use client'
import AppSidebar from '@/components/AppSidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { useEffect, useState } from 'react'
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  useEffect(() => {
    const handleWidthChange = () => {
      setSidebarOpen(window.innerWidth >= 640)
    }
    window.addEventListener('resize', handleWidthChange)
    return () => {
      window.removeEventListener('resize', handleWidthChange)
    }
  }, [])
  return (
    <SidebarProvider open={sidebarOpen}>
      <div className='flex min-h-svh w-full'>
        <AppSidebar />
        <div className='flex-1'>{children}</div>
      </div>
    </SidebarProvider>
  )
}
