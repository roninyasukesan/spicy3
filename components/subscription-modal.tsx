"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Lock } from "lucide-react"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { localGetUser } from "@/lib/local-auth"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  modelName: string
  modelId: string
  onSuccess: () => void
}

export function SubscriptionModal({ isOpen, onClose, modelName, modelId, onSuccess }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const user = localGetUser()
      const useAsaas = process.env.NEXT_PUBLIC_ASAAS_ENABLED === "true"
      if (useAsaas && user?.email) {
        const res = await fetch("/api/payments/asaas/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            description: `Assinatura VIP para ${modelName}`,
            amount: 29.9,
            cycle: "MONTHLY",
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.ok) {
          throw new Error("Falha ao criar assinatura")
        }
      }
      const existingIds = (user as { subscribedModelIds?: string[] })?.subscribedModelIds ?? []
      const updatedUser = user
        ? { ...user, subscribedModelIds: [...existingIds, modelId] }
        : null
      if (updatedUser && typeof window !== "undefined") {
        localStorage.setItem("spicy-auth-user", JSON.stringify(updatedUser))
        window.dispatchEvent(new Event("spicy-auth-change"))
      }
      toast({
        title: "Assinatura realizada!",
        description: `Você agora tem acesso ao conteúdo de ${modelName}.`,
      })
      onSuccess()
      onClose()
    } catch (e: any) {
      toast({
        title: "Erro",
        description: e?.message || "Não foi possível processar a assinatura.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-dark-950 border-gray-800 text-white p-6">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-dark-900 border border-red-600/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Desbloquear Conteúdo VIP</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Assine o perfil de <span className="font-semibold text-white">{modelName}</span> para ter acesso total.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-dark-900 rounded-lg p-5 space-y-4 my-6 border border-gray-800">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Acesso ilimitado aos Stories</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Chat direto e privado</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <Check className="w-5 h-5 text-green-500" />
            <span>Videochamadas exclusivas</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <span className="text-4xl font-bold text-white">R$ 29,90</span>
          <span className="text-gray-500 text-lg"> / mês</span>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-14 text-lg"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-gray-500 hover:text-white h-12"
            onClick={onClose}
          >
            Talvez depois
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
