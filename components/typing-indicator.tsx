"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface TypingIndicatorProps {
  typingUsers: string[]
  className?: string
}

export default function TypingIndicator({ typingUsers, className = "" }: TypingIndicatorProps) {
  const [usernames, setUsernames] = useState<string[]>([])

  useEffect(() => {
    const fetchUsernames = async () => {
      const names = []

      for (const userId of typingUsers) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            names.push(userDoc.data().username || "Someone")
          } else {
            names.push("Someone")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          names.push("Someone")
        }
      }

      setUsernames(names)
    }

    if (typingUsers.length > 0) {
      fetchUsernames()
    } else {
      setUsernames([])
    }
  }, [typingUsers])

  if (usernames.length === 0) return null

  return (
    <div className={`flex items-center gap-2 text-blue-300 text-sm ${className}`}>
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
      </div>
      <span>
        {usernames.length === 1 ? `${usernames[0]} is typing...` : `${usernames.join(" and ")} are typing...`}
      </span>
    </div>
  )
}
