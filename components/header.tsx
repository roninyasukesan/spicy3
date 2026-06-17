"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  Crown,
  Flame,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  Settings,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginForm } from "@/components/login-form"
import { type UserRole } from "@/lib/utils"
import { localGetUser, localSignOut } from "@/lib/local-auth"
import { getConversations } from "@/lib/local-chat"
import { isRemoteDataEnabled } from "@/lib/profile-client"
import { supabase } from "@/lib/supabase"

type RoleNavItem = {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  modelo: "Modelo",
  cliente: "Cliente",
}

function getRoleNavigation(role: UserRole): RoleNavItem[] {
  if (role === "admin") {
    return [
      { id: "admin-dashboard", label: "Painel admin", href: "/dashboard/admin", icon: LayoutDashboard },
      { id: "admin-users", label: "Usuários", href: "/dashboard/admin?tab=usuarios", icon: Users },
      { id: "admin-models", label: "Modelos", href: "/dashboard/admin?tab=modelos", icon: ImageIcon },
      { id: "admin-system", label: "Sistema", href: "/dashboard/admin?tab=sistema", icon: Settings },
      { id: "admin-chat", label: "Mensagens", href: "/dashboard/chat", icon: MessageCircle },
    ]
  }

  if (role === "modelo") {
    return [
      { id: "model-dashboard", label: "Painel modelo", href: "/dashboard/modelo", icon: LayoutDashboard },
      { id: "model-profile", label: "Editar perfil", href: "/dashboard/modelo?tab=profile", icon: User },
      { id: "model-media", label: "Mídias", href: "/dashboard/modelo?tab=media", icon: ImageIcon },
      { id: "model-chat", label: "Mensagens", href: "/dashboard/chat", icon: MessageCircle },
    ]
  }

  return [
    { id: "client-dashboard", label: "Área do cliente", href: "/dashboard/cliente", icon: LayoutDashboard },
    { id: "client-search", label: "Buscar modelos", href: "/busca", icon: Search },
    { id: "client-favorites", label: "Favoritas", href: "/dashboard/cliente", icon: Heart },
    { id: "client-chat", label: "Mensagens", href: "/dashboard/chat", icon: MessageCircle },
    { id: "client-vip", label: "Planos VIP", href: "/vip", icon: Crown },
  ]
}

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

  const handleLogout = async () => {
    localSignOut()
    setRole(null)

    if (isRemoteDataEnabled()) {
      await supabase.auth.signOut()
    }

    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-dark-950/95 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Flame className="h-8 w-8 text-red-600 fill-red-600" />
            <span className="text-2xl font-bold text-white">Spicy Models</span>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Minha área
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 border-gray-800 bg-dark-900 text-gray-200"
                  >
                    <DropdownMenuLabel className="text-gray-400">
                      Área {ROLE_LABELS[role]}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    {getRoleNavigation(role).map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          asChild
                          className="cursor-pointer focus:bg-dark-800 focus:text-white"
                        >
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <div className="space-y-1">
                      <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Área {ROLE_LABELS[role]}
                      </p>
                      {getRoleNavigation(role).map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-900 hover:text-white"
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
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
