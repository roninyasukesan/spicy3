
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedText } from "@/components/animated-text";
import Link from "next/link";

const clientPlans = [
  {
    name: "Plano Free",
    price: "Grátis",
    period: "",
    features: [
      "Fotos com blur",
      "Visualização limitada",
      "Sem contato direto",
    ],
    theme: "basic",
  },
  {
    name: "VIP Mensal",
    price: "R$149",
    period: "/mês",
    features: [
      "Fotos sem blur",
      "Acesso ilimitado",
      "Contato direto",
      "Agendamento prioritário",
    ],
    theme: "gold",
  },
  {
    name: "VIP Anual",
    price: "R$999",
    period: "/ano",
    features: [
      "Todos do Mensal",
      "Desconto anual",
      "Brinde discreto após 6 meses",
      "Atendimento premium",
    ],
    theme: "diamond",
  },
];

export function LandingCheckoutPlansSection() {
  return (
    <section className="bg-dark-950 py-16 text-white">
      <div className="container mx-auto px-4">
        <AnimatedText>
          <h2 className="text-4xl font-bold text-center mb-12">Torne-se VIP e Tenha Experiências Exclusivas</h2>
        </AnimatedText>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clientPlans.map((plan, index) => (
            <AnimatedText key={plan.name} delay={index * 0.1}>
              <Card
                className={cn(
                  "flex flex-col border-2 transition-all duration-300",
                  plan.theme === "basic" && "bg-gray-800 border-gray-700",
                  plan.theme === "gold" && "bg-amber-950/50 border-amber-800/70",
                  plan.theme === "diamond" && "bg-blue-950/50 border-blue-800/70"
                )}
              >
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
                  <Link href={plan.name === "Plano Free" ? "/cadastro" : "/vip"} className="w-full">
                    <Button
                      size="lg"
                      className={cn(
                        "w-full text-lg font-semibold",
                        plan.theme === "basic"
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      )}
                    >
                      {plan.name === "Plano Free" ? "Começar Grátis" : "Assinar Agora"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </AnimatedText>
          ))}
        </div>
      </div>
    </section>
  );
}
