/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'

interface AuthContextType {
  auth: any
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [auth, setAuth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem('APP_AUTH') || '')

        if (auth && auth['access_token']) {
          setAuth(auth)
          const userData = await api.get('/users/me')
          setUser(userData)
        } else {
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login'
          }
        }
      } catch (error) {
        console.log(error)
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login'
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const body = new FormData()
    body.append('username', email)
    body.append('password', password)
    const response = await fetch('/api/auth/access-token', {
      method: 'POST',
      body,
    })
    if (response.ok) {
      const authResponse = await response.json()
      console.log(authResponse)
      localStorage.setItem('APP_AUTH', JSON.stringify(authResponse))
      window.location.href = '/app'
    } else {
      const error: { [key: string]: any } = await response.json()
      console.log(error)
      throw Error(error ? error['detail'] : 'Something went wrong')
    }
  }

  const logout = () => {
    localStorage.removeItem('APP_AUTH')
    window.location.href = '/auth/login'
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        auth,
        isAuthenticated: !!auth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
