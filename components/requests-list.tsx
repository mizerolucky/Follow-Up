"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

type Request = {
  id: string
  userId: string
  name: string
  timestamp: number
  status: "pending" | "accepted" | "rejected"
}

export default function RequestsList() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])

  useEffect(() => {
    // In a real app, you'd fetch requests from a database
    const mockRequests: Request[] = [
      {
        id: "req1",
        userId: "5",
        name: "Alex Turner",
        timestamp: Date.now() - 3600000,
        status: "pending",
      },
      {
        id: "req2",
        userId: "6",
        name: "Emily Davis",
        timestamp: Date.now() - 86400000,
        status: "pending",
      },
    ]

    setRequests(mockRequests)
  }, [user])

  const handleAccept = (requestId: string) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: "accepted" } : req)))
    // In a real app, you'd update the database
  }

  const handleReject = (requestId: string) => {
    setRequests(requests.map((req) => (req.id === requestId ? { ...req, status: "rejected" } : req)))
    // In a real app, you'd update the database
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const pendingRequests = requests.filter((req) => req.status === "pending")

  return (
    <div className="space-y-1">
      {pendingRequests.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No pending requests</div>
      ) : (
        pendingRequests.map((request) => (
          <div key={request.id} className="flex items-center p-3 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium">{request.name}</h3>
                <span className="text-xs text-gray-500">{formatTime(request.timestamp)}</span>
              </div>
              <p className="text-sm text-gray-500">Wants to chat with you</p>
            </div>
            <div className="flex space-x-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={() => handleAccept(request.id)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-red-600"
                onClick={() => handleReject(request.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
