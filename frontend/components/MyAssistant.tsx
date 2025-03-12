'use client'

// import { generateRandomString } from '@/lib/utils'
import {
  AssistantRuntimeProvider,
  Thread,
  ThreadList,
  useAssistantInstructions,
  useAssistantTool,
  useEdgeRuntime,
} from '@assistant-ui/react'
import { makeMarkdownText } from '@assistant-ui/react-markdown'

const MarkdownText = makeMarkdownText()

export function AssistantRoot() {
  const runtime = useEdgeRuntime({
    api: 'http://localhost:8000/api/chat',
  })
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MyAssistant />
    </AssistantRuntimeProvider>
  )
}

// async function createThread() {
//   return { threadId: generateRandomString(16), state: {} }
// }

export function MyAssistant() {
  // this is a frontend system prompt that will be made available to the langgraph agent
  useAssistantInstructions('Your name is Inglesia. You are a princess of the underworld.')

  // this is an frontend function that will be made available to the langgraph agent
  useAssistantTool({
    toolName: 'refresh_page',
    description: 'Refresh the page',
    parameters: {},
    execute: async () => {
      window.location.reload()
    },
  })

  return (
    <div className='grid h-full grid-cols-[200px_1fr]'>
      <ThreadList />
      <Thread assistantMessage={{ components: { Text: MarkdownText } }} />
    </div>
  )
}
