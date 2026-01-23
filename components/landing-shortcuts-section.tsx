
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Crown, UserPlus } from "lucide-react";
import { AnimatedText } from "@/components/animated-text";
import Link from "next/link";
import { getHomeContent, setHomeContent, type HomeContent } from "@/lib/local-auth";
import { InlineText } from "./admin/inline-text";

export function LandingShortcutsSection() {
  const [content, setContent] = useState<HomeContent>(() => getHomeContent());

  useEffect(() => {
    setContent(getHomeContent());
  }, []);

  const handleUpdate = (field: keyof HomeContent, value: string) => {
      const updated = setHomeContent({ [field]: value });
      setContent(updated);
  };

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
                <InlineText 
                    tagName="h3" 
                    className="text-xl font-bold mb-2" 
                    value={content.shortcutSearchTitle} 
                    onSave={(val) => handleUpdate("shortcutSearchTitle", val)}
                />
              </AnimatedText>
              <AnimatedText delay={0.2}>
                <InlineText 
                    tagName="p" 
                    className="text-gray-400 mb-6" 
                    value={content.shortcutSearchDesc} 
                    onSave={(val) => handleUpdate("shortcutSearchDesc", val)}
                />
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
                <InlineText 
                    tagName="h3" 
                    className="text-xl font-bold mb-2" 
                    value={content.shortcutVipTitle} 
                    onSave={(val) => handleUpdate("shortcutVipTitle", val)}
                />
              </AnimatedText>
              <AnimatedText delay={0.3}>
                <InlineText 
                    tagName="p" 
                    className="text-gray-400 mb-6" 
                    value={content.shortcutVipDesc} 
                    onSave={(val) => handleUpdate("shortcutVipDesc", val)}
                />
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
                <InlineText 
                    tagName="h3" 
                    className="text-xl font-bold mb-2" 
                    value={content.shortcutAdvertiseTitle} 
                    onSave={(val) => handleUpdate("shortcutAdvertiseTitle", val)}
                />
              </AnimatedText>
              <AnimatedText delay={0.4}>
                <InlineText 
                    tagName="p" 
                    className="text-gray-400 mb-6" 
                    value={content.shortcutAdvertiseDesc} 
                    onSave={(val) => handleUpdate("shortcutAdvertiseDesc", val)}
                />
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
