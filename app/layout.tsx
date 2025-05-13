import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import FirebaseProvider from "@/components/firebase-provider"
import FirebaseError from "@/components/firebase-error"
import FirebaseStatus from "@/components/firebase-status"
import PresenceProvider from "@/components/presence-provider"
import NetworkStatusProvider from "@/components/network-status-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Follow-up Chat",
  description: "Real-time chat application with one message at a time",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseProvider>
          <NetworkStatusProvider>
            <FirebaseError />
            <PresenceProvider />
            {children}
            <Toaster />
            <FirebaseStatus />
          </NetworkStatusProvider>
        </FirebaseProvider>
      </body>
    </html>
  )
}
