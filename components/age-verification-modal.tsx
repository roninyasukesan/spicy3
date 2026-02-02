"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { localGetUser } from "@/lib/local-auth"

export function AgeVerificationModal() {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const checkVisibility = () => {
      try {
        // DEBUG: Commented out auth check to verify if modal works at all
        // const user = localGetUser()
        // if (user) {
        //   console.log("AgeVerification: User is logged in, hiding modal.")
        //   setIsVisible(false)
        //   return
        // }

        const verified = sessionStorage.getItem("age-verified-v9")
        
        if (!verified) {
          console.log("AgeVerification: User not verified, showing modal.")
          setIsVisible(true)
        } else {
          console.log("AgeVerification: User verified in this session.")
          setIsVisible(false)
        }
      } catch (error) {
        console.error("AgeVerification Error:", error)
        // Fallback: show modal if error occurs, for safety
        setIsVisible(true)
      }
    }

    checkVisibility()
    
    // Listen for auth changes to update visibility immediately
    window.addEventListener("spicy-auth-change", checkVisibility)
    return () => window.removeEventListener("spicy-auth-change", checkVisibility)
  }, [])

  const handleConfirm = () => {
    sessionStorage.setItem("age-verified-v9", "true")
    setIsVisible(false)
  }

  const handleReject = () => {
    window.location.href = "https://www.google.com"
  }

  // Prevent hydration mismatch
  if (!mounted) return null

  // If not visible, return nothing
  if (!isVisible) return null

  return (
    // Raw Overlay with maximum Z-Index to override everything
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 2147483647, // Max 32-bit integer
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="w-full max-w-md bg-zinc-950 border border-red-900/50 rounded-lg shadow-2xl p-6 m-4 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="h-20 w-20 rounded-full bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Conteúdo Adulto (+18)
            </h2>
            <p className="text-gray-300 text-base leading-relaxed">
              Este site contém material destinado exclusivamente a maiores de 18 anos.
              <br />
              Ao entrar, você declara ser maior de idade.
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-2 w-full">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 text-lg transition-transform hover:scale-105" 
              onClick={handleConfirm}
            >
              SIM, SOU MAIOR DE 18 ANOS
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-zinc-500 hover:text-zinc-300 hover:bg-transparent" 
              onClick={handleReject}
            >
              Sair do site
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
