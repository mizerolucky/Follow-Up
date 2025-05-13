import { onAuthStateChanged } from "firebase/auth"
import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore"
import { ref, onDisconnect, set, onValue } from "firebase/database"
import { auth, rtdb, db } from "./firebase"

/**
 * Setup user presence system
 * This tracks when users are online/offline using Firebase Realtime Database
 */
export function setupPresence() {
  // Ensure Firebase services are available
  if (!auth || !rtdb || !db) {
    console.warn("Firebase services not available. Presence system not initialized.")
    return
  }

  // Track auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      const uid = user.uid

      // Create references
      const userStatusFirestoreRef = doc(db, "users", uid)
      const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`)

      // Firestore uses server timestamp while RTDB uses client timestamp
      // We'll use both for different purposes

      // Track connection state
      const connectedRef = ref(rtdb, ".info/connected")

      try {
        onValue(
          connectedRef,
          (snapshot) => {
            if (snapshot.val() === false) {
              // Not connected
              return
            }

            // When user disconnects, update the database
            onDisconnect(userStatusDatabaseRef)
              .set({
                state: "offline",
                lastChanged: new Date().toISOString(),
              })
              .then(() => {
                // User is online
                set(userStatusDatabaseRef, {
                  state: "online",
                  lastChanged: new Date().toISOString(),
                })

                // Update Firestore with online status
                updateDoc(userStatusFirestoreRef, {
                  online: true,
                  lastSeen: serverTimestamp(),
                }).catch((error) => {
                  console.error("Error updating online status:", error)
                })
              })
              .catch((error) => {
                console.error("Error setting onDisconnect:", error)
              })
          },
          (error) => {
            console.error("Error monitoring connection state:", error)
          },
        )
      } catch (error) {
        console.error("Error setting up presence system:", error)
      }

      // Listen for status changes in RTDB and update Firestore
      try {
        onValue(
          userStatusDatabaseRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const status = snapshot.val()

              // Update Firestore with the latest status
              updateDoc(userStatusFirestoreRef, {
                online: status.state === "online",
                lastSeen: serverTimestamp(),
              }).catch((error) => {
                console.error("Error updating status in Firestore:", error)
              })
            }
          },
          (error) => {
            console.error("Error monitoring user status:", error)
          },
        )
      } catch (error) {
        console.error("Error setting up status listener:", error)
      }
    }
  })
}

/**
 * Get a user's online status
 * @param userId The user ID to check
 * @param callback Callback function that receives the online status
 * @returns Unsubscribe function
 */
export function getUserOnlineStatus(userId: string, callback: (status: { online: boolean; lastSeen: any }) => void) {
  // Ensure Firebase services are available
  if (!db) {
    console.warn("Firebase Firestore not available. Cannot get user online status.")
    callback({ online: false, lastSeen: null })
    return () => {}
  }

  if (!navigator.onLine) {
    callback({ online: false, lastSeen: null })
    return () => {}
  }

  try {
    const userRef = doc(db, "users", userId)

    return onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          callback({
            online: data.online || false,
            lastSeen: data.lastSeen,
          })
        } else {
          callback({
            online: false,
            lastSeen: null,
          })
        }
      },
      (error) => {
        console.error("Error getting user online status:", error)
        callback({ online: false, lastSeen: null })
      },
    )
  } catch (error) {
    console.error("Error setting up online status listener:", error)
    callback({ online: false, lastSeen: null })
    return () => {}
  }
}

/**
 * Format the last seen time in a human-readable format
 * @param timestamp Firebase timestamp
 * @returns Formatted string like "2 hours ago" or "Just now"
 */
export function formatLastSeen(timestamp: any): string {
  if (!timestamp) return "Unknown"

  try {
    const lastSeen = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`
    if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`

    return lastSeen.toLocaleDateString()
  } catch (error) {
    console.error("Error formatting last seen:", error)
    return "Unknown"
  }
}
