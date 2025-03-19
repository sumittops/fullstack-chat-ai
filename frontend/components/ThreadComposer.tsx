import { ComposerPrimitive } from '@assistant-ui/react'
import { Button } from './ui/button'
import { Paperclip, SendHorizonal } from 'lucide-react'
import { Textarea } from './ui/textarea'
import { useContext } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import ThreadStateContext from '@/contexts/ThreadStateContext'
import { Badge } from './ui/badge'
import { Dict } from '@/lib/types'

const ThreadComposer = () => {
  const threadStateContext = useContext(ThreadStateContext)
  return (
    <ComposerPrimitive.Root
      style={{ width: 'calc(100vw - 20rem)' }}
      className='fixed -bottom-2 border right-8 space-y-3 border-box rounded-2xl bg-sidebar py-4 px-4 shadow-lg'
    >
      <ComposerPrimitive.Input asChild className='flex-1'>
        <Textarea placeholder='Write your message here' autoFocus className='resize-none border-none' />
      </ComposerPrimitive.Input>
      <div className='flex justify-between space-x-2 bg-transparent'>
        <div>
          {!!threadStateContext && (
            <Select value={threadStateContext?.modelName} onValueChange={threadStateContext?.setThreadModel}>
              <SelectTrigger className='pl-0' disabled={!threadStateContext.setThreadModel}>
                <SelectValue>
                  <div className='pl-2 font-medium'>{LLM_BY_CODE[threadStateContext.modelName]?.name}</div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className='space-y-2'>
                <LLMOptionsComponent />
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Button variant='ghost' size='icon' className='rounded-full text-slate-600'>
            <Paperclip className='h-5 w-5' />
          </Button>
          <ComposerPrimitive.Send asChild>
            <Button size='default' className='disabled:text-slate-200  text-white rounded-full px-4'>
              Send <SendHorizonal className='h-12 w-12 ' />
            </Button>
          </ComposerPrimitive.Send>
        </div>
      </div>
    </ComposerPrimitive.Root>
  )
}

function LLMOptionsComponent() {
  return Object.keys(LLM_BY_PROVIDER).map((provider) => (
    <>
      <SelectGroup key={provider}>
        <div className='text-md font-medium pl-8'>{provider}</div>
        {Array.from<Dict>(LLM_BY_PROVIDER[provider].collection).map((item) => (
          <SelectItem key={item.name} value={item.code}>
            <div className='text-sm font-medium'>{item.name}</div>
            <div className='flex items-center space-x-2 mt-1'>
              {item.features.map((t: string) => (
                <Badge
                  key={`${item.code}_${t}`}
                  className='text-xs font-light text-foreground bg-white border-sidebar hover:bg-white'
                >
                  {t}
                </Badge>
              ))}
            </div>
          </SelectItem>
        ))}
      </SelectGroup>
      <SelectSeparator />
    </>
  ))
}

const LLM_OPTIONS = [
  {
    name: 'GPT 4o',
    provider: 'openai',
    code: 'GPT_4O',
    features: ['image', 'intelligent', 'modern'],
  },
  {
    name: 'GPT 4o mini',
    provider: 'openai',
    code: 'GPT_4O_MINI',
    features: ['image', 'fast', 'cheaper'],
  },
  {
    name: 'o3 mini',
    provider: 'openai',
    code: 'O3_MINI',
    features: ['reasoning', 'low latency'],
  },
  {
    name: 'Llama 3.3 70b',
    provider: 'groq',
    code: 'GROQ_LLAMA_3_3_70B',
    features: ['multilingual', 'open source', 'smart'],
  },
  {
    name: 'R1 Distill Llama 3.3 70b',
    provider: 'groq',
    code: 'GROQ_DEEPSEEK_R1_DISTILL_LLAMA_3.3_70B',
    features: ['reasoning', 'speed'],
  },
  {
    code: 'GEMINI_2.0_FLASH',
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    features: ['multimodal', 'thinking', 'speed'],
  },
  {
    code: 'GEMINI_2.0_FLASH_LITE',
    provider: 'google',
    name: 'Gemini 2.0 Flash Lite',
    features: ['cost effective', 'low latency'],
  },
]
const LLM_BY_CODE = LLM_OPTIONS.reduce((agg, item) => ({ ...agg, [item.code]: item }), {} as Dict)

const LLM_BY_PROVIDER: Dict = {
  Google: {
    collection: LLM_OPTIONS.slice(5),
  },
  OpenAI: {
    collection: LLM_OPTIONS.slice(0, 3),
  },
  Meta: {
    collection: LLM_OPTIONS.slice(3, 4),
  },
  DeepSeek: {
    collection: LLM_OPTIONS.slice(4, 5),
  },
}
export default ThreadComposer
