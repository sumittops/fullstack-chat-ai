'use client'

import { useGetData } from '@/hooks/useData'
import {
  AppendMessage,
  AssistantRuntimeProvider,
  TextContentPart,
  Thread,
  useExternalStoreRuntime,
} from '@assistant-ui/react'
import { makeMarkdownText } from '@assistant-ui/react-markdown'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { convertMessage, dedupeById } from '@/lib/utils'
import { Dict } from '@/lib/types'
import ThreadComposer from './ThreadComposer'
import ThreadStateContext from '@/contexts/ThreadStateContext'

const MarkdownText = makeMarkdownText()
async function postMessageToThread(
  accessToken: string,
  threadId: string,
  message: string,
  handleToken: (token: string) => void,
  isNewChat: boolean = false
) {
  const payload = { prompt: message, content_type: 'text', is_new_chat: isNewChat }
  const response = await fetch(`/api/threads/${threadId}/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP Error! Status ${response.status}`)
  }
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error(`Response empty ${response.status}`)
  }
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    const decoded = new TextDecoder().decode(value)

    handleToken(decoded)
  }
  console.log('stream finished')
}

type ChatMessageType = {
  id: string
  content: string
  role: string
  content_type: string
}

export function ThreadViewManager({ threadId }: { threadId: string }) {
  const [isRunning, setIsRunning] = useState(false)
  const { isLoading, data: messages, mutate } = useGetData<Dict[]>(`/threads/${threadId}/chat`)
  const { data: thread, mutate: mutateThreadDetails } = useGetData<Dict>(`/threads/${threadId}`)
  const [streamingResponse, setStreamingResponse] = useState<ChatMessageType | null>(null)
  const [tempUserMessage, setTempUserMessage] = useState<ChatMessageType | null>(null)
  const { auth } = useAuth()

  const handleStreamingResponse = (token: string) => {
    try {
      const allLines = token
        .trim()
        .split('\n')
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch (e) {
            console.log(e)
            return null
          }
        })
      const lastLine = allLines[allLines.length - 1]
      setStreamingResponse(lastLine)
    } catch (e) {
      console.log(e)
    }
  }
  const runApi = useCallback(
    async (message: string, isNewChat = false) => {
      try {
        setIsRunning(true)
        await postMessageToThread(auth['access_token'], threadId, message, handleStreamingResponse, isNewChat)
        await mutate()
        setStreamingResponse(null)
        setTempUserMessage(null)
        setTimeout(mutateThreadDetails, 1000)
      } catch (e) {
        console.log(e)
      } finally {
        setIsRunning(false)
      }
    },
    [threadId, auth, mutate, mutateThreadDetails]
  )
  const onNew = useCallback(
    async (message: AppendMessage) => {
      const msg = (message.content[0] as TextContentPart).text
      setTempUserMessage({ id: 'temp', role: 'user', content: msg, content_type: 'text' })
      await runApi(msg)
    },
    [threadId, messages]
  )

  const runtimeMessages = useMemo(
    () =>
      dedupeById(
        [...Array.from<Dict>(messages || []), tempUserMessage, streamingResponse].filter((item) => !!item),
        'content'
      ),
    [messages, streamingResponse, tempUserMessage]
  )

  const runtime = useExternalStoreRuntime({
    isRunning,
    messages: runtimeMessages,
    convertMessage,
    onNew,
  })

  useEffect(() => {
    async function firstCall() {
      await runApi('', true)
    }
    if (Array.from(messages || []).length == 1) {
      firstCall()
    }
  }, [messages, runApi])

  return (
    <ThreadStateContext.Provider value={{ modelName: thread ? thread.model_code : '', threadId }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ThreadView isLoading={isLoading || isRunning} thread={thread} />
      </AssistantRuntimeProvider>
    </ThreadStateContext.Provider>
  )
}
export default function ThreadView({ thread }: { isLoading: boolean; thread: Dict | undefined }) {
  return (
    <div className='relative'>
      <div className='flex items-stretch py-3 justify-between absolute left-0 right-0 px-8 space-x-4'>
        <h1 className='text-xl font-semibold'>{(thread || {})['title'] || 'Uknown title'}</h1>
      </div>
      <div>
        <Thread
          assistantMessage={{ components: { Text: MarkdownText } }}
          components={{ Composer: ThreadComposer }}
          assistantAvatar={{ src: '/agent-avatar.jpg' }}
        />
      </div>
    </div>
  )
}
