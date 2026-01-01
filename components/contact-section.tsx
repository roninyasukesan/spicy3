"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";

export function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Contato - ${name || "Usuário"}`);
    const body = encodeURIComponent(`Nome: ${name}\nEmail: ${email}\n\nMensagem:\n${message}`);
    window.location.href = `mailto:contato@spicymodels.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="bg-dark-950 text-white py-16">
      <div className="container mx-auto px-4 space-y-12">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold mb-2 gradient-text">Fale Conosco</h1>
          <p className="text-gray-400">
            Envie sua mensagem ou entre em contato pelos canais abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-dark-900 border-gray-800">
            <CardHeader>
              <CardTitle>Envie uma mensagem</CardTitle>
              <CardDescription>Responderemos o mais breve possível.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-[140px] rounded-md border border-gray-700 bg-dark-800 p-3 text-white"
                    placeholder="Escreva sua mensagem"
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <a href="mailto:contato@spicymodels.com" className="text-lg font-semibold">contato@spicymodels.com</a>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="text-sm text-gray-400">Telefone</div>
                    <a href="tel:+5511999999999" className="text-lg font-semibold">+55 11 99999-9999</a>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-6">
                <Button variant="outline" className="w-full border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat Privado
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
