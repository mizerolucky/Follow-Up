// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import { getDatabase, connectDatabaseEmulator } from "firebase/database"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyChtunXf0hbNUAaLbdw2Dv5ScCrESvtUcI",
  authDomain: "follow-up-14002.firebaseapp.com",
  databaseURL: "https://follow-up-14002-default-rtdb.firebaseio.com",
  projectId: "follow-up-14002",
  storageBucket: "follow-up-14002.firebasestorage.app",
  messagingSenderId: "298223117799",
  appId: "1:298223117799:web:e7c6a43f91eabc1eeb8942",
  measurementId: "G-P100BXYH2C",
}

// Initialize Firebase
let app: any
let auth: any
let db: any
let storage: any
let rtdb: any
let analytics: any

// Initialize Firebase only in the browser
if (typeof window !== "undefined") {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig)
      auth = getAuth(app)
      db = getFirestore(app)
      storage = getStorage(app)
      rtdb = getDatabase(app)

      // Only initialize analytics in production and in the browser
      if (process.env.NODE_ENV === "production") {
        analytics = getAnalytics(app)
      }

      // Connect to emulators in development if needed
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true") {
        connectAuthEmulator(auth, "http://localhost:9099")
        connectFirestoreEmulator(db, "localhost", 8080)
        connectStorageEmulator(storage, "localhost", 9199)
        connectDatabaseEmulator(rtdb, "localhost", 9000)
      }

      console.log("Firebase initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase:", error)
    }
  } else {
    app = getApps()[0]
  }
}

export { app, auth, db, storage, rtdb, analytics }
