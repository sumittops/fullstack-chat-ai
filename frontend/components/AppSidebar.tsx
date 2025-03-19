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
import { differenceInDays } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from './ui/avatar'
import { useMemo } from 'react'
import { AvatarFallback } from '@radix-ui/react-avatar'
import { Separator } from './ui/separator'
import { useGetData } from '@/hooks/useData'
import Link from 'next/link'
import { Button } from './ui/button'
import { useParams } from 'next/navigation'
import { cx } from 'class-variance-authority'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { ChevronUp, Edit, LogOut } from 'lucide-react'
import { Params } from 'next/dist/server/request/params'
import { Dict } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'

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

  return (
    <Sidebar className='border-none shadow-md'>
      <SidebarHeader className='p-4'>
        <h2 className='text-xl font-semibold text-center text-primary'>MeowwChat</h2>
      </SidebarHeader>
      <div className='flex justify-center px-4 my-2'>
        <Link href='/app' className='block w-full'>
          <Button className='rounded-full w-full shadow-lg bg-gradient-to-br to-primary from-primary/60'>
            <Edit className='h-5 w-5' /> New Chat
          </Button>
        </Link>
      </div>
      <SidebarContent>
        <ScrollArea>
          <ThreadList params={params} />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <Separator />
        <Popover>
          <PopoverTrigger>
            <div className='flex space-x-2 items-center px-2'>
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
            <div className='flex flex-col  p-2 space-y-2'>
              <div className='text-lg font-semibold text-primary leading-3'>MeowwChat</div>
              <div className='text-sm font-light'>Bringing the fun back into AI Chat</div>
              <div>
                <Button variant='link' onClick={logout} className='px-0 text-slate-500'>
                  <LogOut /> Log Out
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  )
}

function ThreadList({ params }: { params: Params }) {
  const { data } = useGetData<Dict[]>('/threads')
  const groupedData = useMemo(() => {
    if (data && Array.isArray(data)) {
      const groups: Dict = {
        today: [],
        yesterday: [],
        last_7_days: [],
        older: [],
      }
      const now = new Date()
      for (let i = 0; i < data.length; i++) {
        const thread = data[i]
        const createdAt = new Date(thread['create_time'])
        const dayDiff = differenceInDays(now, createdAt)
        if (dayDiff == 0) {
          groups.today.push(thread)
        } else if (dayDiff == 1) {
          groups.yesterday.push(thread)
        } else if (dayDiff <= 7) {
          groups.last_7_days.push(thread)
        } else {
          groups.older.push(thread)
        }
      }
      return groups
    }
    const empty: Dict = {}
    return empty
  }, [data])
  return Object.keys(groupedData).map((group) => (
    <SidebarGroup key={group}>
      <SidebarGroupLabel className='text-foreground'>{THREAD_GROUP_LABELS[group]}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from<Dict>(groupedData[group]).map((thread) => (
            <SidebarMenuItem
              key={thread['id']}
              className={cx(
                'px-2 py-1 rounded-md hover:bg-primary/5 mr-2',
                thread['id'] == params['chat'] && 'bg-primary/10'
              )}
            >
              <Link className='text-md block text-ellipsis' href={`/app/chat/${thread['id']}`}>
                {thread['title'] ?? 'Unknown title'}
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

const THREAD_GROUP_LABELS: Dict = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 days',
  older: 'Older',
}
