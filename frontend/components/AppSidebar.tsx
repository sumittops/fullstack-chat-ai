'use client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarImage } from './ui/avatar'
import { useMemo } from 'react'
import { AvatarFallback } from '@radix-ui/react-avatar'
import { Separator } from './ui/separator'
import { useGetData } from '@/hooks/useData'
import Link from 'next/link'
import { Button } from './ui/button'
import { useParams } from 'next/navigation'
import { cx } from 'class-variance-authority'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ChevronUp, LogOut } from 'lucide-react'

export default function AppSidebar() {
  const params = useParams()
  const { user } = useAuth()
  const displayName = useMemo(() => {
    return user ? user['display_name'] : ''
  }, [user])
  const email = useMemo(() => {
    return user ? user['email'] : ''
  }, [user])
  const { logout } = useAuth()

  const { isLoading, data } = useGetData('/threads')

  return (
    <Sidebar>
      <SidebarHeader className='py-4 px-2'>
        <h2 className='text-xl font-semibold leading-3'>MeowwChat</h2>
        <p className='text-slate-500 text-sm leading-3'>Makes you go 'meowww'!</p>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Threads</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {!isLoading &&
                data &&
                Array.from(data).map((thread: any) => (
                  <SidebarMenuItem
                    key={thread['id']}
                    className={cx('px-2 rounded-md py-2', thread['id'] == params['chat'] && 'bg-primary/10')}
                  >
                    <Link className='text-md block' href={`/app/chat/${thread['id']}`}>
                      {thread['title'] ?? 'Unknown title'}
                    </Link>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className='flex justify-center px-4 my-4'>
        <Link href='/app' className='block w-full'>
          <Button className='rounded-full w-full shadow-lg bg-primary' variant='default'>
            New Chat
          </Button>
        </Link>
      </div>
      <SidebarFooter>
        <Separator />
        <Popover>
          <PopoverTrigger>
            <div className='flex space-x-2 items-center'>
              <Avatar className='bg-orange-500/90 text-white flex justify-center items-center'>
                <AvatarFallback className='text-2xl text-center'>{displayName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 flex flex-col items-start'>
                <div className='font-medium text-sm leading-3'>{displayName}</div>
                <div className='font-light text-xs'>{email}</div>
              </div>
              <ChevronUp className='opacity-0 group-hover:opacity-100 transition-all text-slate-400' />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <div className='flex flex-col items-center p-2 space-y-2'>
              <div className='text-lg font-medium leading-3'>MeowwChat</div>
              <div className='text-sm font-light'>Bringing the fun back into AI Chat</div>
              <Button variant='ghost' onClick={logout}>
                <LogOut /> Log Out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  )
}
