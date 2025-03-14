/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useData.ts
import useSWR, { SWRConfiguration } from 'swr'
import api from '../lib/api'

// Generic fetcher function for SWR
const fetcher = (url: string) => api.get(url)

export const useGetData = (endpoint: string, options: SWRConfiguration = {}) => {
  return useSWR(endpoint, fetcher, options)
}

export const usePostData = (endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR(endpoint, options)

  const postData = async (data: any) => {
    const response = await api.post(endpoint, data)
    // Optionally trigger revalidation of affected data
    mutate((key: string) => key.startsWith(endpoint), true)
    return response
  }

  return { postData }
}

export const usePutData = (endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR(endpoint, options)

  const putData = async (data: any) => {
    const response = await api.put(endpoint, data)
    // Optionally trigger revalidation of affected data
    mutate(endpoint, true)
    return response
  }

  return { putData }
}

export const useDeleteData = (endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR(endpoint, options)

  const deleteData = async () => {
    const response = await api.delete(endpoint)
    // Optionally trigger revalidation of affected data
    mutate(endpoint, true)
    return response
  }

  return { deleteData }
}
