import { useEffect, useState } from "react"
import { type Message } from "@/lib/local-chat"
import { cn } from "@/lib/utils"
import { decryptMessage, deriveSharedKey, importPublicKey, loadPrivateKey } from "@/lib/crypto"
import { fetchUserPublicKey } from "@/lib/db/messages"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Eye, EyeOff, Lock, Unlock } from "lucide-react"

type ChatMessagesProps = {
  messages: Message[]
  currentUserId: string
}

export function ChatMessages({ messages, currentUserId }: ChatMessagesProps) {
  const [decryptedMap, setDecryptedMap] = useState<Record<string, string>>({})
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    setShowRawData(false)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Erro ao copiar:", err)
    }
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const privateKey = await loadPrivateKey(currentUserId)
      const normalizedCurrentUserId = currentUserId.toLowerCase()

      for (const msg of messages) {
        if (cancelled || decryptedMap[msg.id]) continue

        if (!msg.encryptedData) {
          const fallback = msg.content || "Mensagem protegida. Chave não disponível neste navegador."
          setDecryptedMap(prev => ({ ...prev, [msg.id]: fallback }))
          continue
        }

        if (!privateKey) {
          setDecryptedMap(prev => ({ ...prev, [msg.id]: "Mensagem protegida. Chave não disponível neste navegador." }))
          continue
        }

        const otherId = msg.senderId.toLowerCase() === normalizedCurrentUserId ? msg.receiverId : msg.senderId
        const publicKey = await fetchUserPublicKey(otherId)
        if (!publicKey) {
          setDecryptedMap(prev => ({ ...prev, [msg.id]: "Mensagem protegida. Chave não disponível neste navegador." }))
          continue
        }

        try {
          const parsed = JSON.parse(msg.encryptedData) as { iv: string; ciphertext: string }
          const foreignPublicKey = await importPublicKey(publicKey)
          const sharedKey = await deriveSharedKey(privateKey, foreignPublicKey)
          const plaintext = await decryptMessage(sharedKey, parsed.iv, parsed.ciphertext)
          if (!cancelled) {
            setDecryptedMap(prev => ({ ...prev, [msg.id]: plaintext }))
          }
        } catch {
          if (!cancelled) {
            setDecryptedMap(prev => ({ ...prev, [msg.id]: "Mensagem protegida. Chave não disponível neste navegador." }))
          }
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [messages, currentUserId, decryptedMap])

  return (
    <>
      {messages.map((msg) => {
        const isMe = msg.senderId.toLowerCase() === currentUserId.toLowerCase()
        const content = decryptedMap[msg.id] ?? "..."
        return (
          <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] md:max-w-[70%] rounded-2xl p-3 text-sm shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
                isMe ? "bg-primary-600 text-white rounded-br-none" : "bg-dark-800 text-gray-200 rounded-bl-none"
              )}
              onClick={() => handleMessageClick(msg)}
              title="Clique para ver detalhes da mensagem"
            >
              <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
              <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-200" : "text-gray-500")}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {isMe && <span className="ml-1">{msg.isRead ? "✓✓" : "✓"}</span>}
              </p>
            </div>
          </div>
        )
      })}

      {/* Modal de detalhes da mensagem */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Detalhes da Mensagem</span>
              {selectedMessage && (
                <Badge variant={selectedMessage.encryptedData ? "default" : "secondary"}>
                  {selectedMessage.encryptedData ? (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Criptografada
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 mr-1" />
                      Simples
                    </>
                  )}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Informações completas sobre a mensagem selecionada
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              {/* Conteúdo da mensagem */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Conteúdo</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {decryptedMap[selectedMessage.id] || "Conteúdo não disponível"}
                  </p>
                </div>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ID:</span>
                  <p className="font-mono text-xs break-all">{selectedMessage.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>
                  <p>{new Date(selectedMessage.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Remetente:</span>
                  <p>{selectedMessage.senderId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Destinatário:</span>
                  <p>{selectedMessage.receiverId}</p>
                </div>
                {selectedMessage.isRead && (
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>Lida</p>
                  </div>
                )}
              </div>

              {/* Dados criptografados */}
              {selectedMessage.encryptedData && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Dados Criptografados</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRawData(!showRawData)}
                    >
                      {showRawData ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                  {showRawData && (
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                        {JSON.stringify(JSON.parse(selectedMessage.encryptedData), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(decryptedMap[selectedMessage.id] || "")}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar Conteúdo
                </Button>
                <Button variant="default" onClick={() => setSelectedMessage(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
