"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "./auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"

export default function NewContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setIsLoading(true)

    // Simulate API call to send request
    setTimeout(() => {
      // In a real app, you'd validate the email and send a request
      if (email === "jane@example.com" || email === "john@example.com") {
        setSuccess(true)
        // Reset form after success
        setTimeout(() => {
          setEmail("")
          onOpenChange(false)
          setSuccess(false)
        }, 1500)
      } else {
        setError("User not found. Please check the email address.")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Chat Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-center text-red-800 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 p-3 rounded-md text-green-800 text-sm">Request sent successfully!</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
              <p className="text-sm text-gray-500">Enter the email address of the person you want to chat with</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || success}>
              {isLoading ? "Sending..." : success ? "Sent!" : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
