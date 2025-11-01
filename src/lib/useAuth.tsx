import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, authApi } from './api'
import { Profile } from '../types'

interface User {
  id: string
  email: string
  role: string
  tenant_id?: string
}

interface AuthError {
  message: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: { user: User } | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<{ user: User } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile()
      
      if (response.error) {
        console.error('Error fetching profile:', response.error)
        return null
      }

      return response.data as Profile
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }

  useEffect(() => {
    const token = api.getToken()
    
    if (token) {
      fetchProfile().then((profileData) => {
        if (profileData) {
          const userData = profileData as any
          setUser(userData)
          setProfile(profileData)
          setSession({ user: userData })
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)

      if (response.error) {
        return { error: { message: response.error } as AuthError }
      }

      const { token, user: userData } = response.data as any

      api.setToken(token)
      setUser(userData)
      setSession({ user: userData })

      const profileData = await fetchProfile()
      if (profileData) {
        setProfile(profileData)
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Login failed' 
        } as AuthError 
      }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const response = await authApi.register(email, password)

      if (response.error) {
        return { error: { message: response.error } as AuthError }
      }

      const { token, user: userData } = response.data as any

      api.setToken(token)
      setUser(userData)
      setSession({ user: userData })

      const profileData = await fetchProfile()
      if (profileData) {
        setProfile(profileData)
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Sign up failed' 
        } as AuthError 
      }
    }
  }

  const signOut = async () => {
    try {
      await authApi.logout()
      setUser(null)
      setProfile(null)
      setSession(null)
      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Sign out failed' 
        } as AuthError 
      }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await authApi.resetPassword(email)

      if (response.error) {
        return { error: { message: response.error } as AuthError }
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Password reset failed' 
        } as AuthError 
      }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const isSuperAdmin = (profile: Profile | null) => {
  const defaultEmail = import.meta.env.VITE_DEFAULT_SUPERADMIN_EMAIL
  return profile?.role === 'super_admin' || profile?.email === defaultEmail
}

export const isAdmin = (profile: Profile | null) => {
  return profile?.role === 'admin' || isSuperAdmin(profile)
}

export const isCustomer = (profile: Profile | null) => {
  return profile?.role === 'customer'
}

export const isDelivery = (profile: Profile | null) => {
  return profile?.role === 'delivery'
}
