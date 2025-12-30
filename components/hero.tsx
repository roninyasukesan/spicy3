import { Button } from "@/components/ui/button"
import { Search, Shield, Star } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-950 to-black">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Encontros de Alto Padrão</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Viva momentos únicos com perfis selecionados a dedo,
            <br />
            onde a discrição e a exclusividade são a nossa promessa.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center space-x-2 text-gray-300">
              <Shield className="h-5 w-5 text-gold-500" />
              <span>Perfis Verificados</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Star className="h-5 w-5 text-gold-500" />
              <span>Experiências Premium</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Search className="h-5 w-5 text-gold-500" />
              <span>Busca Inteligente</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-lg px-8 py-3"
            >
              Explorar Perfis de Luxo
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-black text-lg px-8 py-3 bg-transparent"
            >
              Seja uma Modelo de Sucesso
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gold-500/10 rounded-full blur-xl"></div>
    </section>
  )
}
