"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"
import ChatSidebar from "@/components/chat-sidebar"
import ChatArea from "@/components/chat-area"
import ProfileSidebar from "@/components/profile-sidebar"
import { Button } from "@/components/ui/button"
import { Loader2, MessageSquarePlus } from "lucide-react"
import NewChatDialog from "@/components/new-chat-dialog"

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [showProfileSidebar, setShowProfileSidebar] = useState(false)
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/")
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleNewChatCreated = (chatId: string) => {
    setActiveChat(chatId)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-blue-100">Loading your chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-900 to-black">
      {/* Chat sidebar */}
      <ChatSidebar activeChat={activeChat} setActiveChat={setActiveChat} />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <ChatArea chatId={activeChat} onProfileClick={() => setShowProfileSidebar(true)} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center p-8 rounded-lg bg-blue-950/50 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to Follow-up</h2>
              <p className="text-blue-200 mb-6">Select a conversation or start a new one</p>
              <Button
                variant="outline"
                className="bg-blue-600 text-white hover:bg-blue-700 border-none"
                onClick={() => setIsNewChatDialogOpen(true)}
              >
                <MessageSquarePlus className="h-5 w-5 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile sidebar - conditionally rendered */}
      {showProfileSidebar && activeChat && (
        <ProfileSidebar chatId={activeChat} onClose={() => setShowProfileSidebar(false)} />
      )}

      {/* New chat dialog */}
      <NewChatDialog
        open={isNewChatDialogOpen}
        onOpenChange={setIsNewChatDialogOpen}
        onChatCreated={handleNewChatCreated}
      />
    </div>
  )
}
