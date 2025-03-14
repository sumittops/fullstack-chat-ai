import { useRouter } from 'next/router'
import { Toaster } from '@/components/ui/toaster'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (isAuthenticated) router.push('/app')
    else router.replace('/auth/login')
  }, [isAuthenticated, router])
  return (
    <main className='h-dvh'>
      <Toaster />
    </main>
  )
}
