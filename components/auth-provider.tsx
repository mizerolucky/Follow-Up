"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Mock user data
const MOCK_USERS = [
  { id: "1", name: "John Doe", email: "john@example.com", password: "password" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", password: "password" },
]

type User = {
  id: string
  name: string
  email: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
}: {
  children: (props: { user: User | null; isLoading: boolean }) => ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("follow-up-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Simulate API call
    const foundUser = MOCK_USERS.find((u) => u.email === email && u.password === password)

    if (foundUser) {
      const { password, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem("follow-up-user", JSON.stringify(userWithoutPassword))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("follow-up-user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children({ user, isLoading })}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
