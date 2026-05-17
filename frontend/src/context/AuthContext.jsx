import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '@/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const persist = useCallback((userData, jwt) => {
    localStorage.setItem('user',  JSON.stringify(userData))
    localStorage.setItem('token', jwt)
    setUser(userData)
    setToken(jwt)
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData)
    persist(data.user, data.token)
    return data
  }, [persist])

  const login = useCallback(async (formData) => {
    const { data } = await authApi.login(formData)
    persist(data.user, data.token)
    return data
  }, [persist])

  const logout = useCallback(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
