"use client"

import { useFirebaseStatus } from "./firebase-provider"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function FirebaseError() {
  const { isError, errorMessage } = useFirebaseStatus()

  if (!isError) return null

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-blue-950/90 p-4 z-50">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-white">Firebase Initialization Error</AlertTitle>
          <AlertDescription className="text-red-100 mt-2">
            <p className="mb-4">
              {errorMessage || "There was an error initializing Firebase. Please check your environment configuration."}
            </p>
            <p className="text-sm mb-4">
              Make sure all required environment variables are set correctly in your .env file or deployment platform.
            </p>
            <Button
              variant="outline"
              className="bg-red-800 hover:bg-red-700 border-red-600 text-white"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
