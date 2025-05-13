"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Phone, Video, Info, ImageIcon, Paperclip, Mic, Send, Loader2 } from "lucide-react"
import { auth, db, storage } from "@/lib/firebase"
import OnlineStatus from "./online-status"
import TypingIndicator from "./typing-indicator"
import { setTypingStatus, listenToTypingStatus, debounce } from "@/lib/typing"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

interface Message {
  id: string
  text: string
  senderId: string
  timestamp: number
  imageUrl?: string
}

interface ChatAreaProps {
  chatId: string
  onProfileClick: () => void
}

export default function ChatArea({ chatId, onProfileClick }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [chatPartner, setChatPartner] = useState({
    name: "",
    status: "Online",
    avatar: "",
    uid: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Create debounced version of setTypingStatus
  const debouncedSetTypingStatus = useRef(
    debounce((isTyping: boolean) => {
      if (auth.currentUser && chatId) {
        setTypingStatus(auth.currentUser.uid, chatId, isTyping)
      }
    }, 500),
  ).current

  useEffect(() => {
    if (!chatId || !auth.currentUser) return

    setIsLoading(true)
    setMessages([])

    // Fetch chat partner info
    const fetchChatPartner = async () => {
      try {
        const chatDoc = await getDoc(doc(db, "chats", chatId))
        if (chatDoc.exists()) {
          const participants = chatDoc.data().participants
          const partnerId = participants.find((id: string) => id !== auth.currentUser?.uid)

          if (partnerId) {
            const partnerDoc = await getDoc(doc(db, "users", partnerId))
            if (partnerDoc.exists()) {
              const partnerData = partnerDoc.data()
              setChatPartner({
                name: partnerData.username || "User",
                status: partnerData.status || "Online",
                avatar: partnerData.avatar || "",
                uid: partnerId,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat partner:", error)
      }
    }

    fetchChatPartner()

    // Listen for messages
    const messagesRef = collection(db, "chats", chatId, "messages")
    const q = query(messagesRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageData: Message[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        messageData.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          imageUrl: data.imageUrl,
        })
      })
      setMessages(messageData)
      setIsLoading(false)
    })

    // Listen for typing status
    const unsubscribeTyping = listenToTypingStatus(chatId, auth.currentUser.uid, setTypingUsers)

    return () => {
      unsubscribe()
      unsubscribeTyping()
      // Clear typing status when leaving the chat
      if (auth.currentUser) {
        setTypingStatus(auth.currentUser.uid, chatId, false)
      }
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  // Handle typing status
  useEffect(() => {
    if (!auth.currentUser || !chatId) return

    if (inputValue.trim().length > 0) {
      debouncedSetTypingStatus(true)
    } else {
      debouncedSetTypingStatus(false)
    }

    // Clear typing status when component unmounts
    return () => {
      if (auth.currentUser) {
        setTypingStatus(auth.currentUser.uid, chatId, false)
      }
    }
  }, [inputValue, chatId, debouncedSetTypingStatus])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const uploadImage = async (file: File) => {
    const storageRef = ref(storage, `chat-images/${chatId}/${Date.now()}-${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !fileInputRef.current?.files?.length) || !auth.currentUser) return

    setIsSending(true)
    const currentUserId = auth.currentUser.uid

    try {
      // Clear typing status when sending a message
      setTypingStatus(currentUserId, chatId, false)

      // Delete previous messages from this user
      const messagesRef = collection(db, "chats", chatId, "messages")
      const userMessagesQuery = query(messagesRef, where("senderId", "==", currentUserId))
      const userMessages = await getDocs(userMessagesQuery)

      const deletePromises = userMessages.docs.map((doc) => deleteDoc(doc.ref))
      await Promise.all(deletePromises)

      // Prepare new message
      let imageUrl = ""
      if (fileInputRef.current?.files?.length) {
        const file = fileInputRef.current.files[0]
        imageUrl = await uploadImage(file)
        // Clear the file input
        fileInputRef.current.value = ""
      }

      // Add the new message
      const newMessage = {
        text: inputValue,
        senderId: currentUserId,
        timestamp: serverTimestamp(),
        imageUrl,
      }

      await addDoc(messagesRef, newMessage)

      // Update the chat's last message
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: imageUrl ? "📷 Image" : inputValue,
        lastMessageAt: serverTimestamp(),
      })

      // Update user chat metadata
      const userChatRef = doc(db, "userChats", `${currentUserId}_${chatId}`)
      await updateDoc(userChatRef, {
        lastRead: serverTimestamp(),
      })

      setInputValue("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-full bg-blue-950/70 backdrop-blur-sm">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-800">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onProfileClick}>
          <div className="relative">
            <Avatar className="h-10 w-10 bg-blue-700">
              {chatPartner.avatar ? (
                <img src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} className="object-cover" />
              ) : (
                <div className="text-xl font-semibold text-white">{chatPartner.name.charAt(0).toUpperCase()}</div>
              )}
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <OnlineStatus userId={chatPartner.uid} />
            </div>
          </div>
          <div>
            <h2 className="font-medium text-white">{chatPartner.name}</h2>
            <OnlineStatus userId={chatPartner.uid} showText className="mt-0.5" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-blue-800">
            <Phone size={18} />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-blue-800">
            <Video size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800"
            onClick={onProfileClick}
          >
            <Info size={18} />
          </Button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center p-6 rounded-lg bg-blue-900/30">
              <h3 className="text-lg font-medium text-blue-100">No messages yet</h3>
              <p className="text-blue-300 mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === auth.currentUser?.uid ? "justify-end" : "justify-start"}`}
            >
              <div className="flex gap-2 max-w-[80%]">
                {message.senderId !== auth.currentUser?.uid && (
                  <Avatar className="h-8 w-8 mt-1 bg-blue-700">
                    {chatPartner.avatar ? (
                      <img
                        src={chatPartner.avatar || "/placeholder.svg"}
                        alt={chatPartner.name}
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-white">{chatPartner.name.charAt(0).toUpperCase()}</div>
                    )}
                  </Avatar>
                )}
                <div>
                  <div
                    className={`rounded-lg p-3 ${
                      message.senderId === auth.currentUser?.uid
                        ? "bg-blue-600 text-white"
                        : "bg-blue-800/70 text-blue-100"
                    }`}
                  >
                    {message.text && <p className="text-sm">{message.text}</p>}
                    {message.imageUrl && (
                      <div className={`${message.text ? "mt-2" : ""} rounded-md overflow-hidden`}>
                        <img
                          src={message.imageUrl || "/placeholder.svg"}
                          alt="Shared image"
                          className="max-w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-blue-400 mt-1 px-1">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <Avatar className="h-8 w-8 mt-1 bg-blue-700">
                {chatPartner.avatar ? (
                  <img src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} className="object-cover" />
                ) : (
                  <div className="text-sm font-semibold text-white">{chatPartner.name.charAt(0).toUpperCase()}</div>
                )}
              </Avatar>
              <div className="bg-blue-800/40 rounded-lg p-2 px-3">
                <TypingIndicator typingUsers={typingUsers} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-3 border-t border-blue-800">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={() => fileInputRef.current?.files?.length && handleSendMessage()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800"
            onClick={handleFileClick}
            disabled={isSending}
          >
            <ImageIcon size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800"
            onClick={handleFileClick}
            disabled={isSending}
          >
            <Paperclip size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800"
            disabled={isSending}
          >
            <Mic size={20} />
          </Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
            disabled={isSending}
          />
          <Button
            variant="ghost"
            size="icon"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !fileInputRef.current?.files?.length) || isSending}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
