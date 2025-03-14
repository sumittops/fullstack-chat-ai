import { ThreadMessageLike } from '@assistant-ui/react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Dict } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertMessage(message: any): ThreadMessageLike {
  return { role: message['role'] == 'model' ? 'assistant' : message['role'], content: message['content'] }
}

export function dedupeById(items: Dict[], key: string) {
  const itemsByKey: Dict = {}
  for (let i = 0; i < items.length; i++) {
    const dictKey = items[i][key]
    itemsByKey[dictKey] = items[i]
  }
  return Object.values(itemsByKey)
}
