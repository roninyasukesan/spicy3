
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Diamond, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const modelPlans = [
  {
    name: "Plano Básico",
    price: "Grátis",
    period: "",
    features: [
      "Upload de 3 fotos",
      "Sem destaque nas buscas",
      "Acesso à plataforma",
    ],
    isPopular: false,
    theme: "basic",
  },
  {
    name: "VIP Bronze",
    price: "R$149",
    period: "/mês",
    features: [
      "Destaque padrão nas buscas",
      "Fotos ilimitadas",
      "Estatísticas básicas",
      "Suporte prioritário",
    ],
    isPopular: false,
    theme: "bronze",
  },
  {
    name: "VIP Ouro",
    price: "R$349",
    period: "/mês",
    features: [
      "Todos do Bronze",
      "Destaque premium em primeiro lugar",
      "Ver visitantes do perfil",
      "Selo VIP Ouro",
      "Agendamento prioritário",
      "Divulgação semanal no Instagram",
    ],
    isPopular: true,
    theme: "gold",
  },
  {
    name: "VIP Diamante",
    price: "R$699",
    period: "/mês",
    features: [
      "Todos do Ouro",
      "Perfil fixado no topo",
      "Matéria de destaque na homepage",
      "Consultoria de marketing sensual",
    ],
    isPopular: false,
    theme: "diamond",
  },
];

export function CheckoutPlans() {
  const [selectedPlan, setSelectedPlan] = useState("Plano Básico");

  return (
    <section className="bg-dark-950 py-20 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold mb-4 gradient-text">Planos para Modelos</h1>
          <p className="text-xl text-gray-400">
            Escolha o plano ideal para impulsionar sua carreira na Spicy Models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {modelPlans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col border-2 transition-all duration-300",
                plan.theme === "basic" && "bg-gray-800 border-gray-700",
                plan.theme === "bronze" && "bg-amber-950/50 border-amber-800/70",
                plan.theme === "gold" && "bg-yellow-950/50 border-yellow-800/70",
                plan.theme === "diamond" && "bg-blue-950/50 border-blue-800/70",
                selectedPlan === plan.name &&
                  (plan.theme === "basic"
                    ? "border-primary-500 shadow-lg shadow-primary-500/20"
                    : plan.theme === "bronze"
                    ? "border-amber-500 shadow-lg shadow-amber-500/20"
                    : plan.theme === "gold"
                    ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
                    : "border-blue-500 shadow-lg shadow-blue-500/20")
              )}
              onClick={() => setSelectedPlan(plan.name)}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}
              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-3xl font-bold mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  <span className="text-5xl font-extrabold text-primary-500">{plan.price}</span>
                  <span className="text-xl text-gray-500">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow px-6 py-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 flex-shrink-0" />
                      <span className="text-gray-300 text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6">
                <Link href="/cadastro" className="w-full">
                  <Button
                    size="lg"
                    className="w-full text-lg font-semibold bg-primary-600 hover:bg-primary-700"
                  >
                    {plan.name === "Plano Básico" ? "Começar Grátis" : "Assinar Agora"}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
