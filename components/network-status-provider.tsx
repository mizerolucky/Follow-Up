"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface NetworkStatusContextType {
  isOnline: boolean
  retryConnection: () => void
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  retryConnection: () => {},
})

export function useNetworkStatus() {
  return useContext(NetworkStatusContext)
}

export default function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "You're back online",
        description: "Connected to the network",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "You're offline",
        description: "Some features may be limited until you reconnect",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  const retryConnection = () => {
    // Force a refresh of the online status
    setIsOnline(navigator.onLine)

    // If we're actually online but Firebase is having issues,
    // this will trigger a reload to try to reestablish connection
    if (navigator.onLine) {
      toast({
        title: "Retrying connection",
        description: "Attempting to reconnect to the server...",
      })

      // Reload the page to reestablish Firebase connections
      window.location.reload()
    } else {
      toast({
        title: "Still offline",
        description: "Please check your internet connection",
        variant: "destructive",
      })
    }
  }

  return <NetworkStatusContext.Provider value={{ isOnline, retryConnection }}>{children}</NetworkStatusContext.Provider>
}
