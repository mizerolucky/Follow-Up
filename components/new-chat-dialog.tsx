"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Search, Loader2 } from "lucide-react"
import { collection, query, where, getDocs, getDoc, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import OnlineStatus from "./online-status"

interface User {
  uid: string
  email: string
  username: string
  avatar?: string
}

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChatCreated?: (chatId: string) => void
}

export default function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim() || !auth.currentUser) return

    setIsSearching(true)
    setError("")
    setSearchResults([])

    try {
      // Search by email or username
      const usersRef = collection(db, "users")
      const emailQuery = query(usersRef, where("email", "==", searchQuery.toLowerCase().trim()))
      const usernameQuery = query(usersRef, where("username", "==", searchQuery.trim()))

      const [emailResults, usernameResults] = await Promise.all([getDocs(emailQuery), getDocs(usernameQuery)])

      const results: User[] = []

      // Process email results
      emailResults.forEach((doc) => {
        const userData = doc.data() as User
        // Don't include current user
        if (userData.uid !== auth.currentUser?.uid) {
          results.push({
            ...userData,
            uid: doc.id,
          })
        }
      })

      // Process username results
      usernameResults.forEach((doc) => {
        const userData = doc.data() as User
        // Check if this user is already in results (from email search)
        if (userData.uid !== auth.currentUser?.uid && !results.some((user) => user.uid === userData.uid)) {
          results.push({
            ...userData,
            uid: doc.id,
          })
        }
      })

      setSearchResults(results)

      if (results.length === 0) {
        setError("No users found. Try a different search term.")
      }
    } catch (error) {
      console.error("Error searching for users:", error)
      setError("Failed to search for users. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
  }

  const createChat = async () => {
    if (!selectedUser || !auth.currentUser) return

    setIsCreating(true)
    setError("")

    try {
      const currentUserId = auth.currentUser.uid
      const otherUserId = selectedUser.uid

      // Check if a chat already exists between these users
      const chatsRef = collection(db, "chats")
      const q = query(chatsRef, where("participants", "array-contains", currentUserId))

      const querySnapshot = await getDocs(q)
      let existingChatId: string | null = null

      querySnapshot.forEach((doc) => {
        const chatData = doc.data()
        if (chatData.participants.includes(otherUserId)) {
          existingChatId = doc.id
        }
      })

      // If chat exists, use that
      if (existingChatId) {
        if (onChatCreated) {
          onChatCreated(existingChatId)
        }
        onOpenChange(false)
        return
      }

      // Create a new chat
      const newChatRef = doc(collection(db, "chats"))
      await setDoc(newChatRef, {
        participants: [currentUserId, otherUserId],
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessage: "",
      })

      // Get user data for chat display
      const currentUserDoc = await getDoc(doc(db, "users", currentUserId))
      const otherUserDoc = await getDoc(doc(db, "users", otherUserId))

      // Create chat metadata for each participant
      if (currentUserDoc.exists() && otherUserDoc.exists()) {
        const currentUserData = currentUserDoc.data()
        const otherUserData = otherUserDoc.data()

        // Store chat metadata for current user
        await setDoc(doc(db, "userChats", `${currentUserId}_${newChatRef.id}`), {
          chatId: newChatRef.id,
          userId: currentUserId,
          otherUserId: otherUserId,
          otherUserName: otherUserData.username,
          otherUserAvatar: otherUserData.avatar || "",
          lastRead: serverTimestamp(),
        })

        // Store chat metadata for other user
        await setDoc(doc(db, "userChats", `${otherUserId}_${newChatRef.id}`), {
          chatId: newChatRef.id,
          userId: otherUserId,
          otherUserId: currentUserId,
          otherUserName: currentUserData.username,
          otherUserAvatar: currentUserData.avatar || "",
          lastRead: serverTimestamp(),
        })
      }

      if (onChatCreated) {
        onChatCreated(newChatRef.id)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error creating chat:", error)
      setError("Failed to create chat. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-blue-950/90 backdrop-blur-sm border-blue-800 text-blue-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">New Chat</DialogTitle>
          <DialogDescription className="text-blue-300">
            Search for a user to start a new conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
              <Input
                placeholder="Search by email or username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {isSearching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    selectedUser?.uid === user.uid ? "bg-blue-800" : "hover:bg-blue-900/50"
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 bg-blue-700">
                      {user.avatar ? (
                        <img src={user.avatar || "/placeholder.svg"} alt={user.username} className="object-cover" />
                      ) : (
                        <div className="text-xl font-semibold text-white">{user.username.charAt(0).toUpperCase()}</div>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <OnlineStatus userId={user.uid} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-100">{user.username}</h3>
                    <p className="text-xs text-blue-300">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-blue-700 text-blue-300 hover:bg-blue-900 hover:text-blue-100"
          >
            Cancel
          </Button>
          <Button
            onClick={createChat}
            disabled={!selectedUser || isCreating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isCreating ? "Creating..." : "Start Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
