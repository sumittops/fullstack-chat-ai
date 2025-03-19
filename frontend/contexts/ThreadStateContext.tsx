import { createContext } from 'react'

type ThreadStateType = {
  threadId?: string
  setThreadModel?: (modelName: string) => any
  modelName: string
}

const ThreadStateContext = createContext<ThreadStateType | undefined>(undefined)

export default ThreadStateContext
