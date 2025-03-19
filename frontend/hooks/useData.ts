/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useData.ts
import useSWR, { SWRConfiguration } from 'swr'
import api from '../lib/api'

// Generic fetcher function for SWR
const fetcher = (url: string) => api.get(url)

export const useGetData = <T>(endpoint: string, options: SWRConfiguration = {}) => {
  return useSWR<T>(endpoint, fetcher, options)
}

export const usePostData = <T>(endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR<T>(endpoint, options)

  const postData = async (data: any) => {
    const response = await api.post(endpoint, data)
    // Optionally trigger revalidation of affected data
    mutate()
    return response
  }

  return { postData }
}

export const usePutData = <T>(endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR<T>(endpoint, options)

  const putData = async (data: any) => {
    const response = await api.put(endpoint, data)
    // Optionally trigger revalidation of affected data
    mutate()
    return response
  }

  return { putData }
}

export const useDeleteData = <T>(endpoint: string, options: SWRConfiguration = {}) => {
  const { mutate } = useSWR<T>(endpoint, options)

  const deleteData = async () => {
    const response = await api.delete(endpoint)
    mutate()
    return response
  }

  return { deleteData }
}
