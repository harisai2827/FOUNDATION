"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth, useUser, useFirestore, initiateEmailSignIn } from '@/firebase'
import { LogIn, Heart, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { signOut } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      if (user && !isUserLoading && !user.isAnonymous) {
        setIsLoading(true)
        try {
          const adminDoc = await getDoc(doc(db, 'roles_admin', user.uid))
          if (adminDoc.exists()) {
            router.push('/admin')
          } else {
            await signOut(auth)
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "This portal is for authorized administrators only.",
            })
          }
        } catch (error) {
          console.error("Admin check error", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    checkAdmin()
  }, [user, isUserLoading, router, db, auth])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      })
      return
    }

    setIsLoading(true)
    
    initiateEmailSignIn(auth, email, password)
      .catch((error: any) => {
        setIsLoading(false)
        let message = "Invalid email or password."
        
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          message = "Invalid email or password."
        } else if (error.code === 'auth/too-many-requests') {
          message = "Too many failed attempts. Please try again later."
        }

        toast({
          variant: "destructive",
          title: "Login Failed",
          description: message,
        })
      })
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00f0ff]" />
      </div>
    )
  }

  return (
    <div className="neon-login-root">
      <div className="neon-box">
        <div className="neon-form-inner">
          <div className="neon-content">
            <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-white mb-8">
              <LogIn className="w-6 h-6 text-[#00f0ff]" />
              Login
              <Heart className="w-6 h-6 text-[#00f0ff]" />
            </h2>

            <form onSubmit={handleLogin}>
              <input 
                type="email" 
                placeholder="Admin Email" 
                className="neon-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                className="neon-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button 
                type="submit" 
                className="neon-submit flex items-center justify-center" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
              </button>
            </form>

            <div className="flex justify-between mt-4">
              <Link href="#" className="text-[#aaa] text-[13px] no-underline hover:text-[#00f0ff]">Forgot Password</Link>
              <Link href="/signup" className="text-[#aaa] text-[13px] no-underline hover:text-[#00f0ff]">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
