"use client"

import { useEffect } from "react"
import { setupPresence } from "@/lib/presence"
import { useFirebaseStatus } from "./firebase-provider"

export default function PresenceProvider() {
  const { isInitialized } = useFirebaseStatus()

  useEffect(() => {
    // Only initialize presence system when Firebase is ready
    if (isInitialized) {
      setupPresence()
    }
  }, [isInitialized])

  return null
}
