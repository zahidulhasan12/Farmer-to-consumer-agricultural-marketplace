import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiService, tokenStorage } from "../services/api"
import type { LoginInput, SignupInput, User } from "../types/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isFarmer: boolean
  login: (credentials: LoginInput) => Promise<void>
  signup: (data: SignupInput) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const refreshUser = async () => {
    try {
      const accessToken = tokenStorage.getAccessToken()
      const refreshToken = tokenStorage.getRefreshToken()
      if (!accessToken && !refreshToken) {
        setUser(null)
        return
      }

      const userData = await apiService.getMe()
      setUser(userData)
    } catch {
      setUser(null)
      tokenStorage.clearTokens()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()

    const handleUnauthorized = () => {
      setUser(null)
      tokenStorage.clearTokens()
    }
    window.addEventListener("agroconnect:unauthorized", handleUnauthorized)
    return () => {
      window.removeEventListener("agroconnect:unauthorized", handleUnauthorized)
    }
  }, [])

  const login = async (credentials: LoginInput) => {
    const res = await apiService.login(credentials)
    setUser(res.user)
  }

  const signup = async (data: SignupInput) => {
    const res = await apiService.signup(data)
    setUser(res.user)
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "ADMIN",
        isFarmer: user?.role === "FARMER",
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
