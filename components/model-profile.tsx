
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, Phone, MessageCircle, Gift, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { fetchProfileById } from "@/lib/db/profiles";
import { supabase } from "@/lib/supabase";
import { uploadProfileImages } from "@/lib/db/storage";
import { useToast } from "@/components/ui/use-toast";

export function ModelProfile({ profileId }: { profileId: string }) {
  const { toast } = useToast()
  const [model, setModel] = useState<any | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [price, setPrice] = useState("")
  const [bio, setBio] = useState("")
  const [services, setServices] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const p = await fetchProfileById(profileId)
      if (!mounted) return
      if (!p) return
      const m = {
        name: p.name,
        age: p.age ?? 0,
        city: p.city,
        rating: p.rating ?? 0,
        reviews: p.reviews ?? 0,
        price: p.price,
        isVerified: p.is_verified ?? true,
        bio: p.bio ?? "",
        services: p.services ?? [],
        gallery: p.gallery ?? [p.image_url ?? "/placeholder.svg?height=600&width=400"],
      }
      setModel(m)
      setMainImage(m.gallery[0])
      setName(m.name)
      setCity(m.city)
      setPrice(m.price)
      setBio(m.bio)
      setServices(m.services)
    }
    load()
    return () => {
      mounted = false
    }
  }, [profileId])

  const toggleService = (s: string) => {
    setServices(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])
  }

  const save = async () => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      toast({ title: "Faça login", description: "Entre para editar seu perfil", variant: "destructive" })
      return
    }
    let galleryUrls: string[] = []
    if (files.length > 0) {
      galleryUrls = await uploadProfileImages(user.id, files)
    }
    const nextGallery = [...(model?.gallery ?? []), ...galleryUrls]
    const { error } = await supabase
      .from("profiles")
      .update({
        name,
        city,
        price,
        bio,
        services,
        gallery: nextGallery,
      })
      .eq("id", profileId)
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" })
      return
    }
    const updated = { ...model, name, city, price, bio, services, gallery: nextGallery }
    setModel(updated)
    if (nextGallery.length > 0) setMainImage(nextGallery[0])
    setEditing(false)
    setFiles([])
    toast({ title: "Perfil atualizado", description: "Alterações salvas com sucesso" })
  }

  return (
    <div className="bg-dark-950 text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link href="/busca">
          <Button variant="ghost" className="mb-6 hover:bg-dark-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a busca
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-900 border-gray-800">
              <CardContent className="p-4">
                <div className="aspect-[4/5] w-full rounded-lg overflow-hidden mb-4 relative">
                  {mainImage && <Image src={mainImage} alt={model?.name || ""} layout="fill" objectFit="cover" />}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {(model?.gallery ?? []).map((img: string, index: number) => (
                    <div
                      key={index}
                       className={`aspect-square rounded-md cursor-pointer border-2 transition-all relative ${mainImage === img ? 'border-primary-500' : 'border-transparent hover:border-gray-600'}`}
                      onClick={() => setMainImage(img)}
                    >
                      <Image src={img} alt={`${model?.name} ${index + 1}`} layout="fill" objectFit="cover" className="rounded-sm" />
                    </div>
                  ))}
                </div>
                {editing && (
                  <div className="mt-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const list = Array.from(e.target.files || []).slice(0, 10)
                        setFiles(list)
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card className="bg-dark-900 border-gray-800 p-6">
              {!editing ? (
                <h1 className="text-4xl font-bold mb-2">{model?.name}, {model?.age}</h1>
              ) : (
                <input
                  className="w-full p-3 bg-dark-800 border border-gray-700 rounded-lg text-white mb-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <div className="flex items-center text-gray-400 mb-4">
                <MapPin className="h-4 w-4 mr-2" />
                {!editing ? (
                  <span>{model?.city}</span>
                ) : (
                  <input
                    className="w-full p-2 bg-dark-800 border border-gray-700 rounded-lg text-white"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center text-gold-400">
                  <Star className="h-5 w-5 fill-current mr-1" />
                  <span className="text-lg font-bold">{model?.rating}</span>
                </div>
                <span className="text-gray-500">({model?.reviews} avaliações)</span>
                {model?.isVerified && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    Perfil Verificado
                  </Badge>
                )}
              </div>
              {!editing ? (
                <p className="text-gray-300 mb-6 leading-relaxed">{model?.bio}</p>
              ) : (
                <textarea
                  rows={4}
                  className="w-full p-3 bg-dark-800 border border-gray-700 rounded-lg text-white mb-6"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              )}
              {!editing ? (
                <div className="text-primary-500 font-bold text-2xl mb-4">{model?.price}</div>
              ) : (
                <input
                  className="w-full p-2 bg-dark-800 border border-gray-700 rounded-lg text-white mb-4"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              )}
              <div className="space-y-3">
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 text-lg">
                  <Phone className="h-5 w-5 mr-2" />
                  Entrar em Contato
                </Button>
                <Button size="lg" variant="outline" className="w-full border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Enviar Mensagem
                </Button>
                {!editing ? (
                  <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
                    Editar Perfil
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={save}>Salvar</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Cancelar</Button>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-dark-900 border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-4">Serviços Exclusivos</h3>
              <div className="flex flex-wrap gap-3">
                {!editing ? (
                  (model?.services ?? []).map((service: string) => (
                    <Badge key={service} variant="outline" className="text-lg py-1 px-4 border-gray-700">
                      {service}
                    </Badge>
                  ))
                ) : (
                  ["Acompanhante","Massagem","Jantar","Eventos","Viagens","Fetiches"].map((service) => (
                    <Badge
                      key={service}
                      variant={services.includes(service) ? "default" : "outline"}
                      className={`cursor-pointer ${services.includes(service) ? "bg-gold-500 text-black" : "border-gray-600 text-gray-300 hover:bg-gray-700"}`}
                      onClick={() => toggleService(service)}
                    >
                      {service}
                    </Badge>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-dark-900 border-gray-800 p-6">
              <h3 className="text-xl font-bold mb-4">Presentear</h3>
              <p className="text-gray-400 mb-4">Surpreenda com um presente de uma de nossas lojas parceiras.</p>
              <Button variant="secondary" className="w-full bg-gold-500/20 text-gold-300 hover:bg-gold-500/30">
                <Gift className="h-5 w-5 mr-2" />
                Ver Opções de Presentes
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
