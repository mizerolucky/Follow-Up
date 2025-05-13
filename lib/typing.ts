import { ref, set, onValue, off, serverTimestamp, remove } from "firebase/database"
import { rtdb } from "./firebase"

// Debounce time in milliseconds
const TYPING_DEBOUNCE_TIME = 1500

/**
 * Set a user's typing status in a specific chat
 * @param userId The user ID
 * @param chatId The chat ID
 * @param isTyping Whether the user is typing
 */
export function setTypingStatus(userId: string, chatId: string, isTyping: boolean) {
  if (!userId || !chatId || !rtdb) return

  const typingRef = ref(rtdb, `/typing/${chatId}/${userId}`)

  if (isTyping) {
    set(typingRef, {
      timestamp: serverTimestamp(),
    }).catch((error) => {
      console.error("Error setting typing status:", error)
    })
  } else {
    remove(typingRef).catch((error) => {
      console.error("Error removing typing status:", error)
    })
  }
}

/**
 * Listen for typing status changes in a chat
 * @param chatId The chat ID
 * @param currentUserId The current user's ID
 * @param callback Callback function that receives the typing user IDs
 * @returns Cleanup function
 */
export function listenToTypingStatus(chatId: string, currentUserId: string, callback: (typingUsers: string[]) => void) {
  if (!chatId || !rtdb) {
    callback([])
    return () => {}
  }

  const typingRef = ref(rtdb, `/typing/${chatId}`)

  const handleTypingChange = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const typingData = snapshot.val()
    const typingUsers = Object.keys(typingData).filter((uid) => uid !== currentUserId)

    // Check if typing events are recent (within debounce time)
    const now = Date.now()
    const recentTypingUsers = typingUsers.filter((uid) => {
      const timestamp = typingData[uid]?.timestamp
      if (!timestamp) return false

      // If timestamp is a server value, it might not be a number yet
      if (typeof timestamp !== "number") return true

      return now - timestamp < TYPING_DEBOUNCE_TIME
    })

    callback(recentTypingUsers)
  }

  onValue(typingRef, handleTypingChange)

  // Return cleanup function
  return () => {
    off(typingRef, "value", handleTypingChange)
  }
}

/**
 * Create a debounced function
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
