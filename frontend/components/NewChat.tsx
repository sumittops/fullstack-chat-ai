'use client'
import {
  AppendMessage,
  AssistantRuntimeProvider,
  TextContentPart,
  Thread,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import { useState } from 'react'
import { convertMessage } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ThreadComposer from './ThreadComposer'
import ThreadStateContext from '@/contexts/ThreadStateContext'

export default function NewChat() {
  const router = useRouter()
  const { auth } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [selectedModel, setSelectedModel] = useState('GPT_4O_MINI')
  const [messages, setMessages] = useState<any[]>([])
  const onNew = async (message: AppendMessage) => {
    const content = (message.content[0] as TextContentPart).text.trim()
    setMessages([{ content, role: 'user' }])
    try {
      setIsRunning(true)
      const resp = await fetch(`/api/threads/new`, {
        method: 'post',
        body: JSON.stringify({ prompt: content, model_code: selectedModel }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth['access_token']}`,
        },
      })
      if (resp.ok) {
        const response = await resp.json()
        router.push(`/app/chat/${response['thread_id']}?is_new=1`)
      }
    } catch (e) {
      console.log(e)
    }
  }
  const runtime = useExternalStoreRuntime({
    isRunning: false,
    messages,
    convertMessage,
    onNew,
  })
  return (
    <ThreadStateContext.Provider value={{ modelName: selectedModel, setThreadModel: setSelectedModel }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <Thread
          welcome={{
            message: 'Mmmkay! How can I help?',
          }}
          components={{ Composer: ThreadComposer }}
          assistantAvatar={{ src: '/agent-avatar.jpg' }}
        />
      </AssistantRuntimeProvider>
    </ThreadStateContext.Provider>
  )
}
