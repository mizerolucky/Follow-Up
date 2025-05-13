"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { firebaseConfig } from "@/lib/firebase"

// Create a context for Firebase initialization status
interface FirebaseContextType {
  isInitialized: boolean
  isError: boolean
  errorMessage: string | null
}

const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  isError: false,
  errorMessage: null,
})

// Hook to use Firebase context
export function useFirebaseStatus() {
  return useContext(FirebaseContext)
}

// Provider component
export default function FirebaseProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<FirebaseContextType>({
    isInitialized: false,
    isError: false,
    errorMessage: null,
  })

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return

    try {
      // Check if Firebase is already initialized
      if (!getApps().length) {
        const app = initializeApp(firebaseConfig)
        const auth = getAuth(app)

        // If we get here without errors, Firebase is initialized
        setStatus({
          isInitialized: true,
          isError: false,
          errorMessage: null,
        })
      } else {
        // Firebase is already initialized
        setStatus({
          isInitialized: true,
          isError: false,
          errorMessage: null,
        })
      }
    } catch (error: any) {
      console.error("Firebase initialization error:", error)
      setStatus({
        isInitialized: false,
        isError: true,
        errorMessage: error.message || "Failed to initialize Firebase",
      })
    }
  }, [])

  return <FirebaseContext.Provider value={status}>{children}</FirebaseContext.Provider>
}
