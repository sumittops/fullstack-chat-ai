/* eslint-disable @typescript-eslint/no-explicit-any */
// services/api.ts
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  // Get auth token (handle SSR case where localStorage isn't available)
  let auth
  if (typeof window !== 'undefined') {
    try {
      auth = JSON.parse(localStorage.getItem('APP_AUTH') || '')
    } catch (e) {
      console.log(e)
    }
  }

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: `Bearer ${auth['access_token']}` } : {}),
    ...options.headers,
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle auth errors
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('APP_AUTH')
    window.location.href = '/auth/login'
    throw new Error('Unauthorized')
  }

  // Parse JSON response
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

// API service functions
const api = {
  get: (endpoint: string) => fetchWithAuth(`/api${endpoint}`),

  post: (endpoint: string, data: any) =>
    fetchWithAuth(`/api${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: (endpoint: string, data: any) =>
    fetchWithAuth(`/api${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (endpoint: string) =>
    fetchWithAuth(`/api${endpoint}`, {
      method: 'DELETE',
    }),
}

export default api
