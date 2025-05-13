/**
 * Environment configuration with validation
 * This file centralizes all environment variables and provides validation
 */

// Import the Firebase config
import { firebaseConfig as hardcodedFirebaseConfig } from "./firebase"

// Define the shape of our environment configuration
export interface EnvConfig {
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId?: string
    databaseURL: string
  }
  app: {
    name: string
    url: string
    environment: "development" | "production" | "test"
    useFirebaseEmulator: boolean
  }
}

// Function to validate required environment variables
function validateEnv<T extends Record<string, any>>(
  config: T,
  requiredKeys: (keyof T)[],
): { isValid: boolean; missingKeys: string[] } {
  const missingKeys = requiredKeys.filter((key) => !config[key])
  return {
    isValid: missingKeys.length === 0,
    missingKeys: missingKeys as string[],
  }
}

// Get environment variables with validation
export function getEnvConfig(): { config: EnvConfig; isValid: boolean; missingVars: string[] } {
  // Firebase configuration - use environment variables with hardcoded values as fallbacks
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || hardcodedFirebaseConfig.apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || hardcodedFirebaseConfig.authDomain,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || hardcodedFirebaseConfig.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || hardcodedFirebaseConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || hardcodedFirebaseConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || hardcodedFirebaseConfig.appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || hardcodedFirebaseConfig.measurementId,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || hardcodedFirebaseConfig.databaseURL,
  }

  // App configuration
  const appConfig = {
    name: "Follow-up Chat",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    environment: (process.env.NODE_ENV || "development") as EnvConfig["app"]["environment"],
    useFirebaseEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true",
  }

  // Required Firebase keys
  const requiredFirebaseKeys: (keyof typeof firebaseConfig)[] = ["apiKey", "authDomain", "projectId", "databaseURL"]

  // Validate Firebase config
  const { isValid, missingKeys } = validateEnv(firebaseConfig, requiredFirebaseKeys)

  return {
    config: {
      firebase: firebaseConfig,
      app: appConfig,
    },
    isValid,
    missingVars: missingKeys.map((key) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`),
  }
}

// Get environment config
const { config, isValid, missingVars } = getEnvConfig()

// Log warnings for missing variables in development
if (!isValid && typeof window !== "undefined" && config.app.environment === "development") {
  console.warn(
    `Missing required environment variables: ${missingVars.join(", ")}. ` +
      "Using hardcoded values as fallback. This is not recommended for production.",
  )
}

export const env = config
