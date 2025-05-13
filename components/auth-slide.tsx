"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowRight, Loader2, Mail, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AuthLoading from "./auth-loading"

export default function AuthSlide() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Register form state
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("")
  const [username, setUsername] = useState("")

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/chat")
      } else {
        setCheckingAuth(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (checkingAuth) {
    return <AuthLoading />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword)
      // Successful login will trigger the useEffect above and redirect
    } catch (error: any) {
      console.error("Login error:", error)

      // Handle specific error codes
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setError("Invalid email or password")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.")
      } else {
        setError("Failed to login. Please try again.")
      }

      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password strength
    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword)
      const user = userCredential.user

      // Update profile with username
      await updateProfile(user, {
        displayName: username,
      })

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username,
        email: registerEmail.toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        online: true,
        lastSeen: serverTimestamp(),
        status: "Available",
        bio: "",
      })

      toast({
        title: "Account created successfully!",
        description: "Welcome to Follow-up Chat.",
      })

      // Redirect will happen automatically via the useEffect
    } catch (error: any) {
      console.error("Registration error:", error)

      // Handle specific error codes
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address")
      } else {
        setError("Failed to create account. Please try again.")
      }

      setIsLoading(false)
    }
  }

  const toggleForm = () => {
    setError("")
    setIsLogin(!isLogin)
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg bg-blue-950/80 backdrop-blur-sm border border-blue-800 shadow-xl">
      <div className="relative w-full h-full">
        {/* Sliding container */}
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: isLogin ? "translateX(0)" : "translateX(-50%)", width: "200%" }}
        >
          {/* Login Form */}
          <div className="w-1/2 p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-blue-300 mt-1">Sign in to continue to Follow-up</p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-800 rounded-md p-3 mb-4 flex items-center text-red-200 text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-blue-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-blue-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-blue-300 text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={toggleForm}
                  className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"
                >
                  Register now
                  <ArrowRight className="ml-1 h-3 w-3" />
                </button>
              </p>
            </div>
          </div>

          {/* Register Form */}
          <div className="w-1/2 p-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">Create Account</h2>
              <p className="text-blue-300 mt-1">Join Follow-up Chat today</p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-800 rounded-md p-3 mb-4 flex items-center text-red-200 text-sm">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-blue-200">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-blue-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-blue-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm-password" className="text-blue-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                  <Input
                    id="register-confirm-password"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 bg-blue-900/50 border-blue-700 text-blue-100 placeholder:text-blue-400"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-blue-300 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleForm}
                  className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"
                >
                  Sign in
                  <ArrowRight className="ml-1 h-3 w-3" />
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
