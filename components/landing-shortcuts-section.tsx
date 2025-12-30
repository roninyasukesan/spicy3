
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Crown, UserPlus } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import Link from "next/link";

export function LandingShortcutsSection() {
  return (
    <section className="bg-dark-950 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-dark-900 border-gray-800 text-white text-center p-6 transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-red-500/20">
            <CardContent className="p-0">
              <AnimatedText>
                <Search className="h-12 w-12 text-red-500 mx-auto mb-4" />
              </AnimatedText>
              <AnimatedText delay={0.1}>
                <h3 className="text-xl font-bold mb-2">Buscar Modelos</h3>
              </AnimatedText>
              <AnimatedText delay={0.2}>
                <p className="text-gray-400 mb-6">Encontre a modelo ideal para seus desejos.</p>
              </AnimatedText>
              <AnimatedText delay={0.3}>
                <Link href="/busca">
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto">
                    Buscar Agora
                  </Button>
                </Link>
              </AnimatedText>
            </CardContent>
          </Card>

          {/* Assine VIP */}
          <Card className="bg-dark-900 border-gray-800 text-white text-center p-6 transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-red-500/20">
            <CardContent className="p-0">
              <AnimatedText delay={0.1}>
                <Crown className="h-12 w-12 text-red-500 mx-auto mb-4" />
              </AnimatedText>
              <AnimatedText delay={0.2}>
                <h3 className="text-xl font-bold mb-2">Assine VIP</h3>
              </AnimatedText>
              <AnimatedText delay={0.3}>
                <p className="text-gray-400 mb-6">Desbloqueie recursos exclusivos e acesso ilimitado.</p>
              </AnimatedText>
              <AnimatedText delay={0.4}>
                <Link href="/vip">
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto">
                    Planos VIP
                  </Button>
                </Link>
              </AnimatedText>
            </CardContent>
          </Card>

          {/* Anuncie Aqui */}
          <Card className="bg-dark-900 border-gray-800 text-white text-center p-6 transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-red-500/20">
            <CardContent className="p-0">
              <AnimatedText delay={0.2}>
                <UserPlus className="h-12 w-12 text-red-500 mx-auto mb-4" />
              </AnimatedText>
              <AnimatedText delay={0.3}>
                <h3 className="text-xl font-bold mb-2">Anuncie Aqui</h3>
              </AnimatedText>
              <AnimatedText delay={0.4}>
                <p className="text-gray-400 mb-6">Seja uma modelo de luxo e monetize seu talento.</p>
              </AnimatedText>
              <AnimatedText delay={0.5}>
                <Link href="/cadastro">
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto">
                    Quero Anunciar
                  </Button>
                </Link>
              </AnimatedText>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
