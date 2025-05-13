"use client"

import { useState, useEffect } from "react"
import { getUserOnlineStatus, formatLastSeen } from "@/lib/presence"

interface OnlineStatusProps {
  userId: string
  showText?: boolean
  className?: string
}

export default function OnlineStatus({ userId, showText = false, className = "" }: OnlineStatusProps) {
  const [status, setStatus] = useState<{ online: boolean; lastSeen: any }>({
    online: false,
    lastSeen: null,
  })
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check if browser is online
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!userId || isOffline) return

    const unsubscribe = getUserOnlineStatus(userId, (newStatus) => {
      setStatus(newStatus)
    })

    return () => unsubscribe()
  }, [userId, isOffline])

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          isOffline ? "bg-gray-400" : status.online ? "bg-green-500" : "bg-gray-400"
        } ${status.online && !isOffline ? "animate-pulse" : ""}`}
      ></div>
      {showText && (
        <span className="text-xs text-blue-300">
          {isOffline
            ? "Unknown"
            : status.online
              ? "Online"
              : status.lastSeen
                ? `Last seen ${formatLastSeen(status.lastSeen)}`
                : "Offline"}
        </span>
      )}
    </div>
  )
}
