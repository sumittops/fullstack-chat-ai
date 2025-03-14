import { ThreadViewManager } from '@/components/ThreadView'

export default async function ChatThread({ params }: { params: Promise<{ chat: string }> }) {
  const { chat } = await params
  return <ThreadViewManager threadId={chat} />
}
