"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronDown, Download, X, User } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import OnlineStatus from "./online-status"

interface ProfileSidebarProps {
  chatId: string
  onClose: () => void
}

interface SharedFile {
  id: string
  name: string
  url: string
  type: "image" | "document" | "video"
}

export default function ProfileSidebar({ chatId, onClose }: ProfileSidebarProps) {
  const router = useRouter()
  const [chatPartner, setChatPartner] = useState({
    name: "",
    status: "",
    bio: "",
    avatar: "",
    uid: "",
    lastSeen: null,
  })
  const [sharedPhotos, setSharedPhotos] = useState<SharedFile[]>([])
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!chatId || !auth.currentUser) return

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
                status: partnerData.status || "",
                bio: partnerData.bio || "",
                avatar: partnerData.avatar || "",
                uid: partnerId,
                lastSeen: partnerData.lastSeen || null,
              })
            }
          }
        }
        setLoading(false)
      } catch (error) {
        console.error("Error fetching chat partner:", error)
        setLoading(false)
      }
    }

    fetchChatPartner()

    // Mock shared files for demonstration
    const mockPhotos: SharedFile[] = Array(4)
      .fill(null)
      .map((_, i) => ({
        id: `photo-${i}`,
        name: `photo_2024_2.png`,
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/view-lMGydVlbnnaJklle4usckEfKViq5Gu.png",
        type: "image",
      }))
    setSharedPhotos(mockPhotos)
  }, [chatId])

  return (
    <div className="w-80 flex flex-col bg-blue-950/80 backdrop-blur-sm border-l border-blue-800">
      {/* Profile header */}
      <div className="relative p-4 flex flex-col items-center border-b border-blue-800">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-blue-300 hover:text-white hover:bg-blue-800"
          onClick={onClose}
        >
          <X size={18} />
        </Button>

        {loading ? (
          <div className="h-20 w-20 rounded-full bg-blue-800/50 animate-pulse"></div>
        ) : (
          <div className="relative">
            <Avatar className="h-20 w-20 bg-blue-700 mb-3">
              {chatPartner.avatar ? (
                <img src={chatPartner.avatar || "/placeholder.svg"} alt={chatPartner.name} className="object-cover" />
              ) : (
                <div className="text-3xl font-semibold text-white">
                  {chatPartner.name ? chatPartner.name.charAt(0).toUpperCase() : <User size={32} />}
                </div>
              )}
            </Avatar>
            <div className="absolute -bottom-1 -right-1">
              <OnlineStatus userId={chatPartner.uid} />
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-white">{loading ? "Loading..." : chatPartner.name}</h2>

        <div className="mt-1">
          <OnlineStatus userId={chatPartner.uid} showText />
        </div>

        {chatPartner.status && <p className="text-sm text-blue-300 text-center mt-2">{chatPartner.status}</p>}
        {chatPartner.bio && (
          <div className="mt-3 text-sm text-blue-200 text-center px-4">
            <p>{chatPartner.bio}</p>
          </div>
        )}
      </div>

      {/* Settings sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-blue-800">
          <button className="w-full p-4 flex items-center justify-between text-blue-100 hover:bg-blue-900/30">
            <span>Chat Settings</span>
            <ChevronDown size={16} className="text-blue-400" />
          </button>
        </div>

        <div className="border-b border-blue-800">
          <button className="w-full p-4 flex items-center justify-between text-blue-100 hover:bg-blue-900/30">
            <span>Privacy & help</span>
            <ChevronDown size={16} className="text-blue-400" />
          </button>
        </div>

        {/* Shared photos */}
        <div className="border-b border-blue-800">
          <button className="w-full p-4 flex items-center justify-between text-blue-100 hover:bg-blue-900/30">
            <span>Shared photos</span>
            <ChevronDown size={16} className="text-blue-400" />
          </button>
          <div className="p-4 pt-0">
            <div className="grid grid-cols-2 gap-2">
              {sharedPhotos.map((photo) => (
                <div key={photo.id} className="relative group rounded-md overflow-hidden bg-blue-900/50">
                  <img src={photo.url || "/placeholder.svg"} alt={photo.name} className="w-full h-16 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                      <Download size={16} />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 text-[10px] truncate p-1 bg-black/50 text-white">
                    {photo.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shared files */}
        <div className="border-b border-blue-800">
          <button className="w-full p-4 flex items-center justify-between text-blue-100 hover:bg-blue-900/30">
            <span>Shared Files</span>
            <ChevronDown size={16} className="text-blue-400" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="p-4">
          <Button variant="destructive" className="w-full bg-red-900/70 hover:bg-red-800 text-white">
            Block User
          </Button>
        </div>
      </div>
    </div>
  )
}
