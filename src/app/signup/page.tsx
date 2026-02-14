"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { doc, setDoc } from 'firebase/firestore'
import { useAuth, useUser, useFirestore, initiateEmailSignUp } from '@/firebase'
import { ShieldCheck, Heart, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user, isUserLoading } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  useEffect(() => {
    if (user && !isUserLoading && !user.isAnonymous && !isLoading) {
      router.push('/admin')
    }
  }, [user, isUserLoading, router, isLoading])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields.",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      })
      return
    }

    setIsLoading(true)
    
    initiateEmailSignUp(auth, email, password)
      .catch((error: any) => {
        setIsLoading(false)
        let message = "An error occurred during sign up."
        
        if (error.code === 'auth/email-already-in-use') {
          message = "This email is already registered. Please sign in instead."
        } else if (error.code === 'auth/weak-password') {
          message = "Password is too weak. Please use at least 6 characters."
        } else if (error.code === 'auth/invalid-email') {
          message = "Please enter a valid email address."
        }

        toast({
          variant: "destructive",
          title: "Signup Failed",
          description: message,
        })
      })
  }

  useEffect(() => {
    if (user && !user.isAnonymous && isLoading) {
      const createAdminRecord = async () => {
        try {
          await setDoc(doc(db, 'roles_admin', user.uid), {
            email: user.email,
            createdAt: new Date(),
            role: 'owner'
          })
          
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: email.split('@')[0],
            role: 'admin'
          })

          toast({
            title: "Admin Registered",
            description: "Your account has been created with administrative privileges.",
          })
          router.push('/admin')
        } catch (e) {
          console.error("Failed to create admin record", e)
          toast({
            variant: "destructive",
            title: "Database Error",
            description: "Could not create admin profile.",
          })
        } finally {
          setIsLoading(false)
        }
      }
      createAdminRecord()
    }
  }, [user, isLoading, db, router, email])

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
              <ShieldCheck className="w-6 h-6 text-[#ff00ea]" />
              Sign Up
              <Heart className="w-6 h-6 text-[#ff00ea]" />
            </h2>

            <form onSubmit={handleSignup}>
              <input 
                type="email" 
                placeholder="Email Address" 
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
              <input 
                type="password" 
                placeholder="Confirm Password" 
                className="neon-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button 
                type="submit" 
                className="neon-submit flex items-center justify-center" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register Owner"}
              </button>
            </form>

            <div className="flex justify-center mt-4">
              <Link href="/login" className="text-[#aaa] text-[13px] no-underline hover:text-[#ff00ea]">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
