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
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      
      // Update local user state (Mock)
      const user = localGetUser()
      if (user) {
        const existingIds = (user as { subscribedModelIds?: string[] }).subscribedModelIds ?? []
        const updatedUser = {
          ...user,
          subscribedModelIds: [...existingIds, modelId]
        }
        if (typeof window !== "undefined") {
            localStorage.setItem("spicy-auth-user", JSON.stringify(updatedUser))
            // Dispatch event to update UI
            window.dispatchEvent(new Event("spicy-auth-change"))
        }
      }

      toast({
        title: "Assinatura realizada!",
        description: `Você agora tem acesso ao conteúdo de ${modelName}.`,
      })
      onSuccess()
      onClose()
    }, 1500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary-500" />
          </div>
          <DialogTitle className="text-center text-xl">Desbloquear Conteúdo VIP</DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            Assine o perfil de <span className="font-semibold text-white">{modelName}</span> para ter acesso total.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3 my-4 border border-zinc-800">
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-green-500" />
            <span>Acesso ilimitado aos Stories</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-green-500" />
            <span>Chat direto e privado</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-300">
            <Check className="w-4 h-4 text-green-500" />
            <span>Videochamadas exclusivas</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <span className="text-3xl font-bold text-white">R$ 29,90</span>
          <span className="text-zinc-500 text-sm"> / mês</span>
        </div>

        <DialogFooter className="flex-col sm:justify-center gap-2">
          <Button 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold h-12"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Processando..." : "Assinar Agora"}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-zinc-500 hover:text-white"
            onClick={onClose}
          >
            Talvez depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
