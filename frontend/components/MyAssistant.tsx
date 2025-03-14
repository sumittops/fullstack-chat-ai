'use client'

import {
  AssistantRuntimeProvider,
  Thread,
  useAssistantInstructions,
  useAssistantTool,
  useEdgeRuntime,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  CompositeAttachmentAdapter,
} from '@assistant-ui/react'
import { makeMarkdownText } from '@assistant-ui/react-markdown'

const MarkdownText = makeMarkdownText()

export function AssistantRoot() {
  const runtime = useEdgeRuntime({
    api: 'http://localhost:8000/chat/completion',
    adapters: {
      attachments: new CompositeAttachmentAdapter([
        new SimpleImageAttachmentAdapter(),
        new SimpleTextAttachmentAdapter(),
      ]),
    },
  })
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MyAssistant />
    </AssistantRuntimeProvider>
  )
}

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
    <div className='w-full h-screen'>
      <Thread
        assistantMessage={{ components: { Text: MarkdownText } }}
        welcome={{
          message: 'Have a meowwwful chat!',
          suggestions: [
            {
              prompt: 'Tell me a famous story about cats.',
              text: 'Famous cat story',
            },
          ],
        }}
      />
    </div>
  )
}
