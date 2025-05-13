"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function FirebaseStatus() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!auth) {
      setStatus("error")
      setMessage("Firebase Auth is not initialized")
      return
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setStatus("success")
          setMessage(
            user ? `Firebase initialized and authenticated as ${user.email}` : "Firebase initialized successfully",
          )
        },
        (error) => {
          setStatus("error")
          setMessage(`Firebase error: ${error.message}`)
        },
      )

      return () => unsubscribe()
    } catch (error: any) {
      setStatus("error")
      setMessage(`Firebase initialization error: ${error.message}`)
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-900 text-white px-4 py-2 rounded-md shadow-lg">
        Checking Firebase connection...
      </div>
    )
  }

  if (status === "error") {
    return <div className="fixed bottom-4 right-4 bg-red-900 text-white px-4 py-2 rounded-md shadow-lg">{message}</div>
  }

  // Success state - only show briefly then fade out
  return (
    <div className="fixed bottom-4 right-4 bg-green-900 text-white px-4 py-2 rounded-md shadow-lg animate-fade-out">
      {message}
    </div>
  )
}
