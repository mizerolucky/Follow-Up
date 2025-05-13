"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Contact = {
  id: string
  userId: string
  name: string
  lastMessage?: string
  lastMessageTime?: number
}

export default function ContactsList({
  activeChat,
  setActiveChat,
}: {
  activeChat: Contact | null
  setActiveChat: (contact: Contact) => void
}) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    // In a real app, you'd fetch contacts from a database
    const mockContacts: Contact[] = [
      {
        id: "chat1",
        userId: "2",
        name: "Jane Smith",
        lastMessage: "See you tomorrow!",
        lastMessageTime: Date.now() - 1800000,
      },
      {
        id: "chat2",
        userId: "3",
        name: "Mike Johnson",
        lastMessage: "Thanks for the help",
        lastMessageTime: Date.now() - 86400000,
      },
      {
        id: "chat3",
        userId: "4",
        name: "Sarah Williams",
        lastMessage: "Let me know when you're free",
        lastMessageTime: Date.now() - 172800000,
      },
    ]

    setContacts(mockContacts)
  }, [user])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ""

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

  return (
    <div className="space-y-1">
      {contacts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No contacts yet. Add someone to start chatting!</div>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact.id}
            className={`flex items-center p-3 rounded-lg cursor-pointer ${
              activeChat?.id === contact.id ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
            onClick={() => setActiveChat(contact)}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 overflow-hidden">
              <div className="flex justify-between items-baseline">
                <h3 className="font-medium truncate">{contact.name}</h3>
                {contact.lastMessageTime && (
                  <span className="text-xs text-gray-500 ml-2">{formatTime(contact.lastMessageTime)}</span>
                )}
              </div>
              {contact.lastMessage && <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
