
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import Image from "next/image";

export function SensualHero() {
  return (
    <section className="relative bg-black text-white h-[90vh] flex items-center justify-center text-center overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <Image
          src="/placeholder.svg?height=1080&width=1920"
          alt="Sensual Hero Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
      <div className="relative z-10 p-8 max-w-4xl mx-auto">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
          <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
          <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
          <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
          <Star className="h-5 w-5 text-gold-500 fill-gold-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tighter mb-6 text-shadow-lg">
          Onde Seus Desejos Encontram a Exclusividade
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          Explore uma seleção de perfis de alto padrão, verificados para garantir sua total segurança e discrição. A experiência que você busca está a um clique de distância.
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-lg font-semibold px-10 py-6 rounded-full shadow-lg transform hover:scale-105 transition-transform"
        >
          Descobrir Perfis de Elite
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </section>
  );
}
