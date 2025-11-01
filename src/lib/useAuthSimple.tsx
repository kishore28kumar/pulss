import React, { createContext, useContext, useState } from 'react'

interface AuthContextType {
  user: any
  profile: any
  session: any
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState(null)
  const [profile] = useState(null)
  const [session] = useState(null)
  const [loading] = useState(false)

  const signIn = async () => ({ error: null })
  const signUp = async () => ({ error: null })
  const signOut = async () => ({ error: null })
  const resetPassword = async () => ({ error: null })

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Helper functions
export const isSuperAdmin = (profile: any) => false
export const isAdmin = (profile: any) => false  
export const isCustomer = (profile: any) => false
export const isDelivery = (profile: any) => false