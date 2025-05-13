"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Camera, Loader2, User, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [status, setStatus] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/")
        return
      }

      setUser(user)

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setUsername(userData.username || "")
          setStatus(userData.status || "")
          setBio(userData.bio || "")
          setAvatarUrl(userData.avatar || "")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router, toast])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setAvatarFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearAvatarPreview = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const storage = getStorage()
    const avatarRef = ref(storage, `avatars/${userId}/${Date.now()}-${file.name}`)

    await uploadBytes(avatarRef, file)
    const downloadURL = await getDownloadURL(avatarRef)
    return downloadURL
  }

  const deleteOldAvatar = async (avatarUrl: string) => {
    if (!avatarUrl || !avatarUrl.includes("firebasestorage")) return

    try {
      const storage = getStorage()
      const avatarRef = ref(storage, avatarUrl)
      await deleteObject(avatarRef)
    } catch (error) {
      console.error("Error deleting old avatar:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)

    try {
      let newAvatarUrl = avatarUrl

      // Upload new avatar if selected
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.uid, avatarFile)

        // Delete old avatar if it exists
        if (avatarUrl) {
          await deleteOldAvatar(avatarUrl)
        }
      }

      // Update user profile in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        username,
        status,
        bio,
        avatar: newAvatarUrl,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })

      // Clear preview and file
      setAvatarPreview(null)
      setAvatarFile(null)
      setAvatarUrl(newAvatarUrl)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-blue-100">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-blue-300 hover:text-white hover:bg-blue-800"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <Card className="bg-blue-950/80 backdrop-blur-sm border-blue-800 text-blue-100">
          <CardHeader>
            <CardTitle className="text-white">Edit Profile</CardTitle>
            <CardDescription className="text-blue-300">Update your profile information and avatar</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Avatar section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24 cursor-pointer border-2 border-blue-700 hover:border-blue-500 transition-colors">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview || "/placeholder.svg"} alt={username} />
                    ) : avatarUrl ? (
                      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={username} />
                    ) : (
                      <AvatarFallback className="bg-blue-800 text-white text-2xl">
                        {username ? username.charAt(0).toUpperCase() : <User />}
                      </AvatarFallback>
                    )}
                    <div
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
                      onClick={handleAvatarClick}
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </Avatar>
                  {avatarPreview && (
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      onClick={clearAvatarPreview}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-blue-300 hover:text-white hover:bg-blue-800"
                  onClick={handleAvatarClick}
                >
                  Change Avatar
                </Button>
              </div>

              {/* Profile information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-blue-200">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    placeholder="Your username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-blue-200">
                    Status
                  </Label>
                  <Input
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    placeholder="What's on your mind?"
                    maxLength={50}
                  />
                  <p className="text-xs text-blue-400">{status.length}/50 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-blue-200">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400 min-h-[100px]"
                    placeholder="Tell us about yourself"
                    maxLength={200}
                  />
                  <p className="text-xs text-blue-400">{bio.length}/200 characters</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                className="border-blue-700 text-blue-300 hover:bg-blue-900 hover:text-blue-100"
                onClick={() => router.push("/chat")}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
