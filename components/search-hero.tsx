
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import Image from "next/image";

export function SearchHero() {
  return (
    <section className="relative h-[70vh] flex items-center justify-center bg-black">
      <div className="absolute inset-0 opacity-30">
        <Image
          src="/placeholder.svg?height=1080&width=1920"
          alt="Search Hero Background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent"></div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-shadow-lg">
          Encontre a companhia perfeita
        </h1>
        <Card className="max-w-3xl mx-auto bg-dark-800/50 border-gray-700/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Digite uma cidade ou bairro..."
                  className="w-full p-6 pl-10 bg-dark-700/80 border-gray-600 rounded-lg text-white focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <Select>
                <SelectTrigger className="w-full p-6 bg-dark-700/80 border-gray-600 rounded-lg text-white">
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent className="bg-dark-800 border-gray-700 text-white">
                  <SelectItem value="acompanhante">Acompanhante</SelectItem>
                  <SelectItem value="massagem">Massagem</SelectItem>
                  <SelectItem value="eventos">Eventos</SelectItem>
                </SelectContent>
              </Select>
              <Button size="lg" className="w-full p-6 bg-primary-600 hover:bg-primary-700 text-lg font-semibold">
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
