"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { auth } from "@/lib/firebaseClient"
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signOut,
} from "firebase/auth"

interface AuthContextType {
  currentUser: User | null
  isGoogleUser: boolean
  userLoggedIn: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userLoggedIn, setUserLoggedIn] = useState(false)
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        const isGoogle = user.providerData.some(
          (p) => p.providerId === GoogleAuthProvider.PROVIDER_ID
        )
        setIsGoogleUser(isGoogle)
        setUserLoggedIn(true)
      } else {
        setCurrentUser(null)
        setUserLoggedIn(false)
        setIsGoogleUser(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      console.error("Google sign-in failed:", err)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Sign-out failed:", err)
    }
  }

  const value: AuthContextType = {
    currentUser,
    isGoogleUser,
    userLoggedIn,
    loading,
    signInWithGoogle,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
