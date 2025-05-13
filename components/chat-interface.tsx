"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

type Message = {
  id: string
  senderId: string
  text: string
  timestamp: number
}

type Chat = {
  id: string
  userId: string
  name: string
  lastMessage?: string
}

export default function ChatInterface({ chat }: { chat: Chat }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Simulate fetching messages for this chat
  useEffect(() => {
    // In a real app, you'd fetch messages from a database
    const mockMessages: Message[] = [
      {
        id: "1",
        senderId: user?.id || "",
        text: "Hey there!",
        timestamp: Date.now() - 3600000,
      },
      {
        id: "2",
        senderId: chat.userId,
        text: "Hi! How are you?",
        timestamp: Date.now() - 3500000,
      },
    ]

    setMessages(mockMessages)
  }, [chat.id, user?.id, chat.userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || !user) return

    // Create new message
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      text: inputValue,
      timestamp: Date.now(),
    }

    // Filter out the previous message from the same sender
    const filteredMessages = messages.filter(
      (msg) => msg.senderId !== user.id || msg.id === messages[messages.length - 1]?.id,
    )

    // If the last message was from the current user, replace it
    if (filteredMessages.length > 0 && filteredMessages[filteredMessages.length - 1].senderId === user.id) {
      filteredMessages.pop()
    }

    // Add the new message
    setMessages([...filteredMessages, newMessage])
    setInputValue("")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center">
        <div>
          <h2 className="font-medium">{chat.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.senderId === user?.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
              }`}
            >
              <p>{message.text}</p>
              <p className={`text-xs mt-1 ${message.senderId === user?.id ? "text-blue-100" : "text-gray-500"}`}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center space-x-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
