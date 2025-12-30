"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Flame, Menu, User, X } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { LoginForm } from "@/components/login-form"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}