"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Flame, Menu, User, X, MessageCircle } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "@/components/login-form"
import { type UserRole } from "@/lib/utils"
import { localGetUser, localSignOut } from "@/lib/local-auth"
import { getConversations } from "@/lib/local-chat"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const checkUnread = () => {
       const user = localGetUser()
       if (user) {
         setRole(user.role)
         const convs = getConversations(user.email)
         const count = convs.reduce((acc, c) => acc + c.unreadCount, 0)
         setUnreadCount(count)
       } else {
         setRole(null)
         setUnreadCount(0)
       }
    }
    
    checkUnread()
    
    const interval = setInterval(checkUnread, 3000)
    
    const handleStorage = () => checkUnread()
    window.addEventListener('storage', handleStorage)
    
    const bc = new BroadcastChannel("spicy_chat_updates")
    bc.onmessage = (e) => { if (e.data.type === 'update') checkUnread() }
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      bc.close()
    }
  }, [])

  const goToDashboard = () => {
    if (!role) return
    if (role === "admin") {
      router.push("/dashboard/admin")
    } else if (role === "modelo") {
      router.push("/dashboard/modelo")
    } else {
      router.push("/dashboard/cliente")
    }
  }

  const handleLogout = () => {
    localSignOut()
    setRole(null)
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-950/95 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Flame className="h-8 w-8 text-primary-500" />
            <span className="text-2xl font-bold gradient-text">Spicy Models</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/busca" className="text-gray-300 hover:text-white transition-colors">
              Buscar
            </Link>
            <Link href="/sobre" className="text-gray-300 hover:text-white transition-colors">
              Sobre
            </Link>
            <Link href="/vip" className="text-gold-500 hover:text-gold-400 transition-colors font-semibold">
              Seja VIP
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {role ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/chat')} className="relative">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mensagens
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={goToDashboard}>
                  <User className="h-4 w-4 mr-2" />
                  Minha área
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-dark-900 border-gray-800 p-0 max-w-sm rounded-lg" aria-describedby={undefined}>
                    <div className="sr-only">
                      <DialogTitle>Login</DialogTitle>
                    </div>
                    <LoginForm />
                  </DialogContent>
                </Dialog>
                <Button
                  className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                  onClick={() => (window.location.href = "/cadastro")}
                >
                  Anunciar Grátis
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-4">
              <Link href="/busca" className="text-gray-300 hover:text-white transition-colors">
                Buscar
              </Link>
              <Link href="/sobre" className="text-gray-300 hover:text-white transition-colors">
                Sobre
              </Link>
              <Link href="/vip" className="text-gold-500 hover:text-gold-400 transition-colors font-semibold">
                Seja VIP
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-800">
                {role ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={goToDashboard}>
                      <User className="h-4 w-4 mr-2" />
                      Minha área
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4 mr-2" />
                          Entrar
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-dark-900 border-gray-800 p-0 max-w-sm rounded-lg" aria-describedby={undefined}>
                        <div className="sr-only">
                          <DialogTitle>Login</DialogTitle>
                        </div>
                        <LoginForm />
                      </DialogContent>
                    </Dialog>
                    <Button
                      className="bg-gradient-to-r from-primary-600 to-primary-700"
                      onClick={() => (window.location.href = "/cadastro")}
                    >
                      Anunciar Grátis
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
