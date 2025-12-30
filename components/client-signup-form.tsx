"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Lock, Phone, MapPin } from "lucide-react"
import { AnimatedText } from "@/components/animated-text";
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface ClientSignupFormProps {
  onBack: () => void
}

export function ClientSignupForm({ onBack }: ClientSignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    age: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro no cadastro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            city: formData.city,
            age: formData.age,
            role: 'client'
          }
        }
      })

      if (error) {
        throw error
      }

      if (data?.session) {
        // Clientes não possuem perfil público; apenas concluem o cadastro.
        // Em futuro fluxo, poderemos criar tabela específica para clientes.
        toast({
          title: "Conta criada",
          description: "Login efetuado. Você pode navegar como cliente.",
        })
      } else {
        toast({
          title: "Confirmação necessária",
          description: "Verifique seu email e faça login para finalizar.",
        })
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar o cadastro.",
      })
      
      // Redirect or go back to login
      onBack()

    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao criar sua conta.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-16 min-h-[80vh] flex items-center">
      <div className="container mx-auto px-4">
        <AnimatedText>
          <Button variant="ghost" onClick={onBack} className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </AnimatedText>

        <AnimatedText delay={0.1} className="max-w-md mx-auto">
          <Card className="bg-dark-800/50 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-primary-500" />
              </div>
              <CardTitle className="text-2xl text-white">Cadastro de Cliente</CardTitle>
              <p className="text-gray-400">Crie sua conta para acessar perfis premium</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatedText delay={0.2}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary-500" />
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.3}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-primary-500" />
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.4}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-primary-500" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.5}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-primary-500" />
                        Cidade
                      </label>
                      <select
                        required
                        className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      >
                        <option value="">Selecione</option>
                        <option value="sao-paulo">São Paulo</option>
                        <option value="rio-janeiro">Rio de Janeiro</option>
                        <option value="belo-horizonte">Belo Horizonte</option>
                        <option value="brasilia">Brasília</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Idade</label>
                      <input
                        type="number"
                        min="18"
                        required
                        className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.6}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-primary-500" />
                      Senha
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.7}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Lock className="h-4 w-4 mr-2 text-primary-500" />
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full p-3 bg-dark-700 border border-gray-600 rounded-lg text-white focus:border-primary-500 focus:outline-none"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.8}>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" required className="rounded border-gray-600 bg-dark-700" />
                    <span className="text-sm text-gray-400">
                      Aceito os{" "}
                      <a href="/termos" className="text-primary-500 hover:underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="/privacidade" className="text-primary-500 hover:underline">
                        Política de Privacidade
                      </a>
                    </span>
                  </div>
                </AnimatedText>

                <AnimatedText delay={0.9}>
                  <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700" disabled={isLoading}>
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </AnimatedText>
              </form>
            </CardContent>
          </Card>
        </AnimatedText>
      </div>
    </section>
  )
}
