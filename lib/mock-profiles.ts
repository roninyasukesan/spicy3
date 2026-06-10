import { Model } from "@/components/model-details-modal";

// Extend Model interface to include physical characteristics
export interface ModelWithCharacteristics extends Model {
  characteristics?: {
    hairColor?: string;
    ethnicity?: string;
    bodyType?: string;
    height?: string;
    ageRange?: string;
    eyes?: string;
    breasts?: string;
    tattoos?: string;
    piercings?: string;
  };
}

export const mockProfiles: ModelWithCharacteristics[] = [
  {
    "id": "1",
    "name": "Jessica",
    "age": 23,
    "city": "São Paulo",
    "price": "R$ 1000/h",
    "rating": 4.8,
    "reviews": 38,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Sua putinha de luxo. Adoro ser submissa e realizar suas fantasias mais sujas.",
    "services": [
      "Viagens",
      "Massagem",
      "Cinema",
      "Passeios",
      "Eventos",
      "Fetiches",
      "Pernoite"
    ],
    "fetishes": [
      "Oral sem camisinha (oral natural)",
      "Sexo com amarras (bondage)",
      "Troca de mensagens quentes",
      "Striptease",
      "Beijo grego",
      "Sadomasoquismo",
      "Submissão",
      "Massagem erótica",
      "Sexo no carro"
    ],
    "exclusions": [
      "Não atende casais",
      "Não atende homens casados",
      "Não atende fetiches extremos"
    ],
    "characteristics": {
      "hairColor": "Asiática (estilo oriental)",
      "ethnicity": "Latina",
      "bodyType": "Natural",
      "height": "Mediana",
      "ageRange": "23–27",
      "eyes": "Mel",
      "breasts": "Silicone Grande",
      "tattoos": "Algumas",
      "piercings": "Língua"
    }
  },
  {
    "id": "2",
    "name": "Paloma",
    "age": 20,
    "city": "São Paulo",
    "price": "R$ 350/h",
    "rating": 4.5,
    "reviews": 14,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Morena fogosa, quente como o inferno. Vou te deixar de pernas bambas.",
    "services": [
      "Acompanhante",
      "Fetiches",
      "Pernoite",
      "Eventos",
      "Passeios",
      "Massagem",
      "Festas",
      "Jantar"
    ],
    "fetishes": [
      "Dirty talk (fala suja)",
      "Roleplay / Fantasias",
      "Masturbação mútua",
      "Cuckold / Voyeurismo",
      "Strapon (cinto com pênis)",
      "Facesitting (sentar no rosto)",
      "Dominação feminina (FemDom)",
      "BDSM leve",
      "Striptease",
      "Dupla penetração (DP)"
    ],
    "exclusions": [
      "Não faz oral sem camisinha",
      "Não atende homens casados"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Morena",
      "bodyType": "Plus Size",
      "height": "Baixa",
      "ageRange": "18–22",
      "eyes": "Mel",
      "breasts": "Silicone Grande",
      "tattoos": "Discretas",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "3",
    "name": "Carla",
    "age": 37,
    "city": "São Paulo",
    "price": "R$ 1000/h",
    "rating": 4.5,
    "reviews": 19,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Viciada em prazer e em proporcionar momentos intensos. Venha me usar.",
    "services": [
      "Fetiches",
      "Viagens",
      "Pernoite",
      "Passeios",
      "Cinema",
      "Eventos",
      "Jantar",
      "Massagem"
    ],
    "fetishes": [
      "GFE (Namoradinha)",
      "Meias / Lingerie",
      "Strapon (cinto com pênis)",
      "Banho erótico",
      "Pegação em público",
      "Sexo com sapatos ou botas",
      "Striptease",
      "Ejaculação facial",
      "Cuckold / Voyeurismo",
      "Facesitting (sentar no rosto)",
      "Dupla penetração (DP)",
      "Sexo com vendas nos olhos",
      "Posição 69",
      "Uniformes (colegial, policial, enfermeira etc)",
      "Submissão"
    ],
    "exclusions": [
      "Não atende casais",
      "Não grava vídeos",
      "Não atende fetiches extremos"
    ],
    "characteristics": {
      "hairColor": "Loira",
      "ethnicity": "Asiática",
      "bodyType": "Turbinada",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Mel",
      "breasts": "Silicone Grande",
      "tattoos": "Muitas / Fechada",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "4",
    "name": "Diana",
    "age": 26,
    "city": "Rio de Janeiro",
    "price": "R$ 400/h",
    "rating": 4.7,
    "reviews": 35,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Corpo escultural e mente perversa. Pronta para te levar ao delírio.",
    "services": [
      "Jantar",
      "Fetiches",
      "Massagem",
      "Cinema",
      "Festas",
      "Passeios",
      "Eventos"
    ],
    "fetishes": [
      "Facesitting (sentar no rosto)",
      "Troca de mensagens quentes",
      "Sexo com sapatos ou botas",
      "Pés / Podolatria",
      "Ejaculação facial",
      "Masturbação mútua",
      "Beijo na boca",
      "Pegada firme / Rough sex",
      "Pegação em público",
      "Strapon (cinto com pênis)",
      "Dirty talk (fala suja)",
      "Cuckold / Voyeurismo"
    ],
    "exclusions": [
      "Não atende casais",
      "Não faz oral sem camisinha",
      "Não atende fetiches extremos"
    ],
    "characteristics": {
      "hairColor": "Loira",
      "ethnicity": "Negra",
      "bodyType": "Natural",
      "height": "Alta",
      "ageRange": "23–27",
      "eyes": "Preto",
      "breasts": "Silicone Grande",
      "tattoos": "Discretas",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "5",
    "name": "Bruna",
    "age": 43,
    "city": "Rio de Janeiro",
    "price": "R$ 700/h",
    "rating": 4.9,
    "reviews": 6,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Adoro um sexo anal bem gostoso e profundo. Vem conferir.",
    "services": [
      "Festas",
      "Eventos",
      "Massagem",
      "Cinema",
      "Acompanhante",
      "Jantar",
      "Fetiches"
    ],
    "fetishes": [
      "Troca de mensagens quentes",
      "Sexo com amarras (bondage)",
      "Masturbação mútua",
      "Dirty talk (fala suja)",
      "Dominação feminina (FemDom)",
      "Posição 69",
      "Uniformes (colegial, policial, enfermeira etc)",
      "BDSM leve"
    ],
    "exclusions": [
      "Não atende casais",
      "Não atende homens casados",
      "Não grava vídeos",
      "Não atende fetiches extremos"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Mestiça",
      "bodyType": "Plus Size",
      "height": "Alta",
      "ageRange": "35+",
      "eyes": "Preto",
      "breasts": "Silicone Médio",
      "tattoos": "Muitas / Fechada",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "6",
    "name": "Camila",
    "age": 34,
    "city": "Rio de Janeiro",
    "price": "R$ 700/h",
    "rating": 4.6,
    "reviews": 26,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Sem tabus e sem limites. Uma ninfomaníaca pronta para te satisfazer.",
    "services": [
      "Viagens",
      "Acompanhante",
      "Festas",
      "Passeios",
      "Pernoite"
    ],
    "fetishes": [
      "Dominação feminina (FemDom)",
      "BDSM leve",
      "Posição 69",
      "Strapon (cinto com pênis)",
      "Facesitting (sentar no rosto)",
      "Troca de mensagens quentes",
      "Pés / Podolatria",
      "Pegação em público",
      "Dirty talk (fala suja)",
      "Meias / Lingerie"
    ],
    "exclusions": [
      "Não atende fetiches extremos",
      "Não atende homens casados",
      "Não atende casais"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Mestiça",
      "bodyType": "Magra",
      "height": "Baixa",
      "ageRange": "28–35",
      "eyes": "Mel",
      "breasts": "Naturais Pequenos",
      "tattoos": "Nenhuma",
      "piercings": "Nariz"
    }
  },
  {
    "id": "7",
    "name": "Priscila",
    "age": 41,
    "city": "Belo Horizonte",
    "price": "R$ 800/h",
    "rating": 4.6,
    "reviews": 12,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Acompanhante de alto nível para homens que buscam sexo de verdade, sem enrolação.",
    "services": [
      "Jantar",
      "Cinema",
      "Fetiches",
      "Eventos",
      "Pernoite",
      "Festas"
    ],
    "fetishes": [
      "Submissão",
      "Pegada firme / Rough sex",
      "Beijo na boca",
      "Pés / Podolatria",
      "Uniformes (colegial, policial, enfermeira etc)",
      "Sexo com amarras (bondage)",
      "Strapon (cinto com pênis)",
      "GFE (Namoradinha)",
      "Roleplay / Fantasias",
      "Dominação feminina (FemDom)",
      "Facesitting (sentar no rosto)"
    ],
    "exclusions": [
      "Não grava vídeos",
      "Não atende homens casados"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Negra",
      "bodyType": "Magra",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Preto",
      "breasts": "Silicone Gigante",
      "tattoos": "Muitas / Fechada",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "8",
    "name": "Débora",
    "age": 23,
    "city": "Belo Horizonte",
    "price": "R$ 800/h",
    "rating": 4.8,
    "reviews": 40,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Sem tabus e sem limites. Uma ninfomaníaca pronta para te satisfazer.",
    "services": [
      "Festas",
      "Eventos",
      "Jantar",
      "Massagem",
      "Fetiches",
      "Pernoite",
      "Viagens"
    ],
    "fetishes": [
      "Pegação em público",
      "Submissão",
      "Beijo na boca",
      "Facesitting (sentar no rosto)",
      "Massagem tântrica",
      "Sexo anal",
      "Striptease",
      "Pés / Podolatria",
      "Posição 69",
      "Dupla penetração (DP)"
    ],
    "exclusions": [
      "Não grava vídeos",
      "Não faz oral sem camisinha"
    ],
    "characteristics": {
      "hairColor": "Colorida",
      "ethnicity": "Mestiça",
      "bodyType": "Curvilínea",
      "height": "Mediana",
      "ageRange": "23–27",
      "eyes": "Verde",
      "breasts": "Naturais Médios",
      "tattoos": "Muitas / Fechada",
      "piercings": "Vários"
    }
  },
  {
    "id": "9",
    "name": "Paula",
    "age": 21,
    "city": "Belo Horizonte",
    "price": "R$ 500/h",
    "rating": 4.9,
    "reviews": 9,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Loirinha safada com carinha de anjo. As aparências enganam...",
    "services": [
      "Pernoite",
      "Viagens",
      "Passeios",
      "Jantar",
      "Festas",
      "Acompanhante",
      "Fetiches",
      "Eventos"
    ],
    "fetishes": [
      "Pegação em público",
      "Beijo na boca",
      "Banho erótico",
      "Massagem tântrica",
      "Cuckold / Voyeurismo",
      "Sexo no carro",
      "Sadomasoquismo",
      "Dirty talk (fala suja)",
      "Posição 69",
      "Strapon (cinto com pênis)",
      "Dominação feminina (FemDom)",
      "Sexo com vendas nos olhos"
    ],
    "exclusions": [
      "Não atende fetiches extremos",
      "Não faz oral sem camisinha",
      "Não atende homens casados",
      "Não grava vídeos"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Asiática",
      "bodyType": "Plus Size",
      "height": "Mediana",
      "ageRange": "18–22",
      "eyes": "Azul",
      "breasts": "Silicone Grande",
      "tattoos": "Discretas",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "10",
    "name": "Zoe",
    "age": 24,
    "city": "Brasília",
    "price": "R$ 350/h",
    "rating": 4.6,
    "reviews": 38,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Carinhosa no trato, mas uma devassa entre quatro paredes. Faço tudo.",
    "services": [
      "Pernoite",
      "Fetiches",
      "Cinema",
      "Acompanhante",
      "Eventos"
    ],
    "fetishes": [
      "Sexo com vendas nos olhos",
      "Meias / Lingerie",
      "Sexo anal",
      "Massagem erótica",
      "Oral sem camisinha (oral natural)",
      "Submissão",
      "Sexo com amarras (bondage)",
      "Filmagem amadora (com consentimento)",
      "Pegada firme / Rough sex",
      "Beijo grego",
      "Dirty talk (fala suja)",
      "Roleplay / Fantasias",
      "Sexo no carro",
      "Sexo com espelhos",
      "Cuckold / Voyeurismo"
    ],
    "exclusions": [
      "Não atende homens casados",
      "Não atende fetiches extremos",
      "Não atende casais"
    ],
    "characteristics": {
      "hairColor": "Castanha",
      "ethnicity": "Morena",
      "bodyType": "Curvilínea",
      "height": "Alta",
      "ageRange": "23–27",
      "eyes": "Preto",
      "breasts": "Silicone Grande",
      "tattoos": "Discretas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "11",
    "name": "Fabiana",
    "age": 41,
    "city": "Brasília",
    "price": "R$ 300/h",
    "rating": 5.0,
    "reviews": 31,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Bumbum gigante e guloso. Adoro levar tapas e puxões de cabelo.",
    "services": [
      "Acompanhante",
      "Massagem",
      "Passeios",
      "Festas",
      "Pernoite",
      "Viagens"
    ],
    "fetishes": [
      "Pegação em público",
      "Cuckold / Voyeurismo",
      "Sexo anal",
      "Sexo com sapatos ou botas",
      "Pés / Podolatria",
      "Sadomasoquismo",
      "Oral sem camisinha (oral natural)",
      "BDSM leve",
      "Dirty talk (fala suja)",
      "Masturbação mútua",
      "Sexo com vendas nos olhos",
      "Filmagem amadora (com consentimento)"
    ],
    "exclusions": [
      "Não faz oral sem camisinha",
      "Não atende homens casados"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Mestiça",
      "bodyType": "Turbinada",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Azul",
      "breasts": "Naturais Pequenos",
      "tattoos": "Algumas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "12",
    "name": "Nayara",
    "age": 30,
    "city": "Brasília",
    "price": "R$ 500/h",
    "rating": 5.0,
    "reviews": 32,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Experiência namoradinha (GFE) com sexo intenso e muita cumplicidade.",
    "services": [
      "Passeios",
      "Cinema",
      "Eventos",
      "Fetiches",
      "Pernoite"
    ],
    "fetishes": [
      "Massagem tântrica",
      "Uniformes (colegial, policial, enfermeira etc)",
      "Sexo com vendas nos olhos",
      "Cuckold / Voyeurismo",
      "Meias / Lingerie",
      "Sadomasoquismo",
      "Submissão",
      "Dominação feminina (FemDom)",
      "Ejaculação facial",
      "Dupla penetração (DP)",
      "Beijo na boca"
    ],
    "exclusions": [
      "Não atende casais",
      "Não atende fetiches extremos",
      "Não atende homens casados",
      "Não faz oral sem camisinha"
    ],
    "characteristics": {
      "hairColor": "Asiática (estilo oriental)",
      "ethnicity": "Morena",
      "bodyType": "Natural",
      "height": "Baixa",
      "ageRange": "28–35",
      "eyes": "Mel",
      "breasts": "Naturais Pequenos",
      "tattoos": "Muitas / Fechada",
      "piercings": "Vários"
    }
  },
  {
    "id": "13",
    "name": "Daniela",
    "age": 26,
    "city": "Salvador",
    "price": "R$ 450/h",
    "rating": 4.7,
    "reviews": 27,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Dominadora experiente. Vou te ensinar o verdadeiro significado de prazer e dor.",
    "services": [
      "Jantar",
      "Eventos",
      "Massagem",
      "Fetiches",
      "Festas",
      "Viagens"
    ],
    "fetishes": [
      "Oral sem camisinha (oral natural)",
      "Sexo no carro",
      "Meias / Lingerie",
      "Roleplay / Fantasias",
      "Troca de mensagens quentes",
      "Beijo na boca",
      "Dirty talk (fala suja)",
      "Posição 69",
      "Sadomasoquismo",
      "Pegação em público",
      "Facesitting (sentar no rosto)"
    ],
    "exclusions": [
      "Não grava vídeos",
      "Não atende casais"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Negra",
      "bodyType": "Magra",
      "height": "Alta",
      "ageRange": "23–27",
      "eyes": "Verde",
      "breasts": "Naturais Médios",
      "tattoos": "Discretas",
      "piercings": "Língua"
    }
  },
  {
    "id": "14",
    "name": "Alice",
    "age": 19,
    "city": "Salvador",
    "price": "R$ 300/h",
    "rating": 4.8,
    "reviews": 25,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Morena fogosa, quente como o inferno. Vou te deixar de pernas bambas.",
    "services": [
      "Cinema",
      "Festas",
      "Jantar",
      "Fetiches",
      "Viagens",
      "Pernoite",
      "Massagem",
      "Passeios"
    ],
    "fetishes": [
      "Beijo grego",
      "Beijo na boca",
      "Sexo com espelhos",
      "Pegação em público",
      "Cuckold / Voyeurismo",
      "Pés / Podolatria",
      "Strapon (cinto com pênis)",
      "Sexo com amarras (bondage)",
      "Massagem tântrica"
    ],
    "exclusions": [
      "Não grava vídeos",
      "Não atende casais",
      "Não atende fetiches extremos"
    ],
    "characteristics": {
      "hairColor": "Loira",
      "ethnicity": "Negra",
      "bodyType": "Plus Size",
      "height": "Alta",
      "ageRange": "18–22",
      "eyes": "Preto",
      "breasts": "Silicone Gigante",
      "tattoos": "Algumas",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "15",
    "name": "Isabela",
    "age": 41,
    "city": "Salvador",
    "price": "R$ 800/h",
    "rating": 4.9,
    "reviews": 43,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Loirinha safada com carinha de anjo. As aparências enganam...",
    "services": [
      "Fetiches",
      "Cinema",
      "Acompanhante",
      "Passeios",
      "Pernoite"
    ],
    "fetishes": [
      "Uniformes (colegial, policial, enfermeira etc)",
      "Meias / Lingerie",
      "Pegação em público",
      "Sexo com vendas nos olhos",
      "GFE (Namoradinha)",
      "Roleplay / Fantasias",
      "Dominação feminina (FemDom)",
      "Sexo com amarras (bondage)",
      "Dupla penetração (DP)",
      "Cuckold / Voyeurismo",
      "Submissão"
    ],
    "exclusions": [
      "Não faz oral sem camisinha",
      "Não atende casais"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Branca",
      "bodyType": "Fitness",
      "height": "Baixa",
      "ageRange": "35+",
      "eyes": "Mel",
      "breasts": "Naturais Grandes",
      "tattoos": "Nenhuma",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "16",
    "name": "Julia",
    "age": 28,
    "city": "Fortaleza",
    "price": "R$ 450/h",
    "rating": 4.8,
    "reviews": 6,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Sem tabus e sem limites. Uma ninfomaníaca pronta para te satisfazer.",
    "services": [
      "Massagem",
      "Eventos",
      "Viagens",
      "Festas",
      "Passeios",
      "Jantar"
    ],
    "fetishes": [
      "Submissão",
      "Banho erótico",
      "Dominação feminina (FemDom)",
      "Pegada firme / Rough sex",
      "Sexo com amarras (bondage)",
      "Dupla penetração (DP)",
      "Pés / Podolatria",
      "Roleplay / Fantasias",
      "Masturbação mútua",
      "Massagem erótica",
      "Sexo com vendas nos olhos",
      "Strapon (cinto com pênis)",
      "Dirty talk (fala suja)",
      "Massagem tântrica",
      "Brinquedos eróticos"
    ],
    "exclusions": [
      "Não atende fetiches extremos",
      "Não atende casais"
    ],
    "characteristics": {
      "hairColor": "Asiática (estilo oriental)",
      "ethnicity": "Branca",
      "bodyType": "Plus Size",
      "height": "Alta",
      "ageRange": "28–35",
      "eyes": "Verde",
      "breasts": "Silicone Médio",
      "tattoos": "Algumas",
      "piercings": "Língua"
    }
  },
  {
    "id": "17",
    "name": "Bruna",
    "age": 21,
    "city": "Fortaleza",
    "price": "R$ 400/h",
    "rating": 4.8,
    "reviews": 36,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Viciada em prazer e em proporcionar momentos intensos. Venha me usar.",
    "services": [
      "Festas",
      "Passeios",
      "Jantar",
      "Viagens",
      "Eventos",
      "Cinema",
      "Fetiches",
      "Massagem"
    ],
    "fetishes": [
      "Sexo com vendas nos olhos",
      "Sexo anal",
      "Facesitting (sentar no rosto)",
      "Sexo com amarras (bondage)",
      "Pegada firme / Rough sex",
      "Ejaculação facial",
      "Sexo no carro",
      "Massagem tântrica",
      "Dupla penetração (DP)"
    ],
    "exclusions": [
      "Não faz oral sem camisinha",
      "Não atende homens casados"
    ],
    "characteristics": {
      "hairColor": "Morena",
      "ethnicity": "Asiática",
      "bodyType": "Turbinada",
      "height": "Alta",
      "ageRange": "18–22",
      "eyes": "Azul",
      "breasts": "Silicone Médio",
      "tattoos": "Discretas",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "18",
    "name": "Nicole",
    "age": 23,
    "city": "Fortaleza",
    "price": "R$ 700/h",
    "rating": 4.7,
    "reviews": 19,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Loirinha safada com carinha de anjo. As aparências enganam...",
    "services": [
      "Cinema",
      "Massagem",
      "Eventos",
      "Acompanhante",
      "Jantar",
      "Pernoite",
      "Passeios",
      "Viagens"
    ],
    "fetishes": [
      "Troca de mensagens quentes",
      "Posição 69",
      "Sexo anal",
      "Sexo com espelhos",
      "Strapon (cinto com pênis)",
      "Pegada firme / Rough sex",
      "Pegação em público",
      "Filmagem amadora (com consentimento)",
      "BDSM leve",
      "Sadomasoquismo",
      "Oral sem camisinha (oral natural)",
      "Sexo com amarras (bondage)",
      "Sexo no carro"
    ],
    "exclusions": [
      "Não grava vídeos",
      "Não atende casais",
      "Não atende homens casados"
    ],
    "characteristics": {
      "hairColor": "Asiática (estilo oriental)",
      "ethnicity": "Branca",
      "bodyType": "Fitness",
      "height": "Baixa",
      "ageRange": "23–27",
      "eyes": "Azul",
      "breasts": "Silicone Médio",
      "tattoos": "Algumas",
      "piercings": "Língua"
    }
  }
];