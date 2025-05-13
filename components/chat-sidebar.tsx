"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Search, Plus, MoreVertical, Video, Edit, User, LogOut, Loader2, AlertCircle } from "lucide-react"
import { signOut } from "firebase/auth"
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore"
import NewChatDialog from "./new-chat-dialog"
import OnlineStatus from "./online-status"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatPreview {
  id: string
  name: string
  lastMessage: string
  timestamp: number
  avatar: string
  userId: string
}

interface ChatSidebarProps {
  activeChat: string | null
  setActiveChat: (chatId: string) => void
}

export default function ChatSidebar({ activeChat, setActiveChat }: ChatSidebarProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userProfile, setUserProfile] = useState({
    name: "",
    avatar: "",
  })
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set initial state
    setIsOffline(!navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Fetch user profile with retry mechanism
  const fetchUserProfile = useCallback(async () => {
    if (!auth.currentUser) {
      console.log("No authenticated user found")
      return
    }

    try {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserProfile({
          name: userData.username || auth.currentUser.email?.split("@")[0] || "User",
          avatar: userData.avatar || "",
        })
      } else {
        // Fallback to Firebase auth data if Firestore document doesn't exist
        setUserProfile({
          name: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User",
          avatar: auth.currentUser.photoURL || "",
        })
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error)

      // Check if offline error
      if (error.message?.includes("offline")) {
        setIsOffline(true)

        // Use Firebase auth data as fallback
        if (auth.currentUser) {
          setUserProfile({
            name: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User",
            avatar: auth.currentUser.photoURL || "",
          })
        }

        // Retry after a delay if we're still under the retry limit
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
          }, 3000) // Retry after 3 seconds
        }
      }
    }
  }, [retryCount])

  // Retry fetching when we come back online or retry count changes
  useEffect(() => {
    if (!isOffline || retryCount > 0) {
      fetchUserProfile()
    }
  }, [isOffline, retryCount, fetchUserProfile])

  useEffect(() => {
    if (!auth.currentUser) return

    // Fetch user profile
    fetchUserProfile()

    // Listen for user's chats
    const fetchChats = () => {
      setIsLoading(true)

      try {
        const userChatsRef = collection(db, "userChats")
        const q = query(userChatsRef, where("userId", "==", auth.currentUser!.uid), orderBy("lastRead", "desc"))

        const unsubscribe = onSnapshot(
          q,
          async (snapshot) => {
            const chatData: ChatPreview[] = []

            // Process each user chat
            for (const docSnapshot of snapshot.docs) {
              const data = docSnapshot.data()

              // Get the actual chat document to get the last message
              try {
                const chatDoc = await getDoc(doc(db, "chats", data.chatId))
                if (chatDoc.exists()) {
                  const chatInfo = chatDoc.data()

                  chatData.push({
                    id: data.chatId,
                    name: data.otherUserName,
                    lastMessage: chatInfo.lastMessage || "Start a conversation",
                    timestamp: chatInfo.lastMessageAt?.toMillis() || Date.now(),
                    avatar: data.otherUserAvatar || "",
                    userId: data.otherUserId,
                  })
                }
              } catch (error) {
                console.error("Error fetching chat:", error)
              }
            }

            setChats(chatData)
            setIsLoading(false)
            setIsOffline(false) // We successfully got data, so we're online
          },
          (error) => {
            console.error("Error listening to chats:", error)
            setIsLoading(false)

            // Check if offline error
            if (error.message?.includes("offline")) {
              setIsOffline(true)

              // Show offline toast only once
              if (!isOffline) {
                toast({
                  title: "You're offline",
                  description: "Some features may be limited until you reconnect.",
                  variant: "destructive",
                })
              }
            }
          },
        )

        return unsubscribe
      } catch (error) {
        console.error("Error setting up chat listener:", error)
        setIsLoading(false)
        return () => {}
      }
    }

    const unsubscribe = fetchChats()

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [toast, isOffline])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const goToProfile = () => {
    router.push("/profile")
  }

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

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

  const handleNewChatCreated = (chatId: string) => {
    setActiveChat(chatId)
  }

  const handleRetryConnection = () => {
    setRetryCount((prev) => prev + 1)
    toast({
      title: "Retrying connection",
      description: "Attempting to reconnect to the server...",
    })
  }

  return (
    <div className="w-80 flex flex-col bg-blue-950/80 backdrop-blur-sm border-r border-blue-800">
      {/* User profile header */}
      <div className="p-4 flex items-center justify-between border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-blue-400 cursor-pointer" onClick={goToProfile}>
              {userProfile.avatar ? (
                <img src={userProfile.avatar || "/placeholder.svg"} alt="Your profile" className="object-cover" />
              ) : (
                <div className="text-xl font-semibold text-white">{userProfile.name.charAt(0).toUpperCase()}</div>
              )}
            </Avatar>
            {auth.currentUser && (
              <div className="absolute -bottom-1 -right-1">
                <OnlineStatus userId={auth.currentUser.uid} />
              </div>
            )}
          </div>
          <span className="text-blue-100 font-medium">{userProfile.name}</span>
        </div>
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-blue-800">
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-blue-950/90 backdrop-blur-sm border-blue-800 text-blue-100">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-800" />
              <DropdownMenuItem className="cursor-pointer hover:bg-blue-900 focus:bg-blue-900" onClick={goToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-blue-800" />
              <DropdownMenuItem
                className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-blue-900 focus:bg-blue-900"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-blue-300 hover:text-white hover:bg-blue-800">
            <Video size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800"
            onClick={goToProfile}
          >
            <Edit size={18} />
          </Button>
        </div>
      </div>

      {/* Offline warning banner */}
      {isOffline && (
        <div className="bg-red-900/50 border-y border-red-800 py-2 px-3 flex items-center justify-between">
          <div className="flex items-center text-red-200 text-sm">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>You're offline</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-red-700 bg-red-900/50 text-red-200 hover:bg-red-800"
            onClick={handleRetryConnection}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Search bar */}
      <div className="p-3 border-b border-blue-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
          />
        </div>
      </div>

      {/* New chat button */}
      <Button
        variant="ghost"
        className="mx-3 mt-3 bg-blue-800/50 text-blue-100 hover:bg-blue-700 justify-start"
        onClick={() => setIsNewChatDialogOpen(true)}
        disabled={isOffline}
      >
        <Plus size={18} className="mr-2" />
        New Chat
      </Button>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : isOffline && chats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-blue-300">Unable to load conversations</p>
            <p className="text-blue-400 text-sm mt-1">Please check your connection</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-blue-700 text-blue-300 hover:bg-blue-800"
              onClick={handleRetryConnection}
            >
              <Loader2 className={`mr-2 h-3 w-3 ${retryCount > 0 ? "animate-spin" : ""}`} />
              Retry
            </Button>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-blue-300">No conversations yet</p>
            <p className="text-blue-400 text-sm mt-1">Start a new chat to begin messaging</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                activeChat === chat.id ? "bg-blue-800/70" : "hover:bg-blue-900/50"
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 bg-blue-700">
                  {chat.avatar ? (
                    <img src={chat.avatar || "/placeholder.svg"} alt={chat.name} className="object-cover" />
                  ) : (
                    <div className="text-xl font-semibold text-white">{chat.name.charAt(0).toUpperCase()}</div>
                  )}
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  <OnlineStatus userId={chat.userId} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <h3 className="font-medium text-blue-100 truncate">{chat.name}</h3>
                  <span className="text-xs text-blue-400">{formatTime(chat.timestamp)}</span>
                </div>
                <p className="text-sm text-blue-300 truncate">{chat.lastMessage}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New chat dialog */}
      <NewChatDialog
        open={isNewChatDialogOpen}
        onOpenChange={setIsNewChatDialogOpen}
        onChatCreated={handleNewChatCreated}
      />
    </div>
  )
}
