import { ComposerPrimitive } from '@assistant-ui/react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { SendHorizonal } from 'lucide-react'

const ThreadComposer = () => {
  return (
    <ComposerPrimitive.Root className='flex items-stretch justify-between absolute left-0 right-0 space-x-4 border-box z-20 rounded-2xl'>
      <ComposerPrimitive.Input asChild className='flex-1'>
        <Input placeholder='Write your message here' autoFocus />
      </ComposerPrimitive.Input>

      <ComposerPrimitive.Send asChild>
        <Button size='default' className='disabled:text-slate-300'>
          <SendHorizonal className='h-12 w-12 text-slate-100 ' />
        </Button>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  )
}

export default ThreadComposer
