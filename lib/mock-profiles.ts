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
    "name": "Nayara",
    "age": 27,
    "city": "São Paulo",
    "price": "R$ 450/h",
    "rating": 4.7,
    "reviews": 8,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Acompanhante de alto nível para homens que buscam sexo de verdade, sem enrolação.",
    "services": [
      "Viagens",
      "Jantar",
      "Pernoite"
    ],
    "fetishes": [
      "Oral sem camisinha (oral natural)",
      "Facesitting",
      "Meias / Lingerie",
      "Ejaculação facial"
    ],
    "characteristics": {
      "hairColor": "Morena",
      "ethnicity": "Negra",
      "bodyType": "Fitness",
      "height": "Baixa",
      "ageRange": "23–27",
      "eyes": "Mel",
      "breasts": "Naturais Médios",
      "tattoos": "Nenhuma",
      "piercings": "Nariz"
    }
  },
  {
    "id": "2",
    "name": "Evelyn",
    "age": 34,
    "city": "São Paulo",
    "price": "R$ 300/h",
    "rating": 4.7,
    "reviews": 12,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Pronta para realizar seus desejos mais ocultos e inconfessáveis.",
    "services": [
      "Passeios",
      "Festas",
      "Jantar",
      "Eventos"
    ],
    "fetishes": [
      "Facesitting",
      "Sexo com vendas nos olhos",
      "Massagem erótica",
      "Sexo com amarras (bondage)",
      "Strapon (cinto com pênis)"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Morena",
      "bodyType": "Turbinada",
      "height": "Mediana",
      "ageRange": "28–35",
      "eyes": "Azul",
      "breasts": "Silicone Grande",
      "tattoos": "Algumas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "3",
    "name": "Thais",
    "age": 42,
    "city": "São Paulo",
    "price": "R$ 300/h",
    "rating": 4.6,
    "reviews": 14,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Adoro um sexo anal bem gostoso e profundo. Vem conferir.",
    "services": [
      "Jantar",
      "Massagem",
      "Festas",
      "Viagens",
      "Passeios"
    ],
    "fetishes": [
      "Voyeurismo",
      "Masturbação mútua",
      "Dominação feminina (FemDom)"
    ],
    "characteristics": {
      "hairColor": "Morena",
      "ethnicity": "Mestiça",
      "bodyType": "Natural",
      "height": "Baixa",
      "ageRange": "35+",
      "eyes": "Verde",
      "breasts": "Naturais Médios",
      "tattoos": "Nenhuma",
      "piercings": "Língua"
    }
  },
  {
    "id": "4",
    "name": "Vitoria",
    "age": 18,
    "city": "Rio de Janeiro",
    "price": "R$ 500/h",
    "rating": 4.9,
    "reviews": 11,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Doce por fora, mas pegando fogo por dentro. Adoro engolir tudo.",
    "services": [
      "Eventos",
      "Jantar",
      "Viagens",
      "Pernoite",
      "Cinema"
    ],
    "fetishes": [
      "Dupla penetração (DP)",
      "Striptease",
      "Beijo grego",
      "Dominação feminina (FemDom)",
      "Masturbação mútua"
    ],
    "characteristics": {
      "hairColor": "Castanha",
      "ethnicity": "Branca",
      "bodyType": "Magra",
      "height": "Baixa",
      "ageRange": "18–22",
      "eyes": "Verde",
      "breasts": "Silicone Grande",
      "tattoos": "Muitas / Fechada",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "5",
    "name": "Isabela",
    "age": 19,
    "city": "Rio de Janeiro",
    "price": "R$ 600/h",
    "rating": 4.7,
    "reviews": 23,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Adoro um sexo anal bem gostoso e profundo. Vem conferir.",
    "services": [
      "Passeios",
      "Pernoite",
      "Eventos",
      "Massagem"
    ],
    "fetishes": [
      "GFE (Namoradinha)",
      "Facesitting",
      "Oral sem camisinha (oral natural)",
      "Submissão"
    ],
    "characteristics": {
      "hairColor": "Colorida",
      "ethnicity": "Latina",
      "bodyType": "Magra",
      "height": "Mediana",
      "ageRange": "18–22",
      "eyes": "Castanho",
      "breasts": "Naturais Médios",
      "tattoos": "Nenhuma",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "6",
    "name": "Marcela",
    "age": 23,
    "city": "Rio de Janeiro",
    "price": "R$ 600/h",
    "rating": 4.7,
    "reviews": 22,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Pronta para realizar seus desejos mais ocultos e inconfessáveis.",
    "services": [
      "Passeios",
      "Massagem",
      "Viagens"
    ],
    "fetishes": [
      "Meias / Lingerie",
      "Massagem tântrica",
      "Roleplay / Fantasias",
      "Masturbação mútua"
    ],
    "characteristics": {
      "hairColor": "Morena",
      "ethnicity": "Morena",
      "bodyType": "Fitness",
      "height": "Alta",
      "ageRange": "23–27",
      "eyes": "Castanho",
      "breasts": "Naturais Pequenos",
      "tattoos": "Muitas / Fechada",
      "piercings": "Língua"
    }
  },
  {
    "id": "7",
    "name": "Ingrid",
    "age": 25,
    "city": "Belo Horizonte",
    "price": "R$ 700/h",
    "rating": 4.8,
    "reviews": 38,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Carinhosa no trato, mas uma devassa entre quatro paredes. Faço tudo.",
    "services": [
      "Massagem",
      "Viagens",
      "Eventos",
      "Passeios"
    ],
    "fetishes": [
      "Massagem tântrica",
      "Sexo com vendas nos olhos",
      "Sadomasoquismo",
      "Dominação feminina (FemDom)",
      "Dupla penetração (DP)"
    ],
    "characteristics": {
      "hairColor": "Colorida",
      "ethnicity": "Branca",
      "bodyType": "Curvilínea",
      "height": "Mediana",
      "ageRange": "23–27",
      "eyes": "Mel",
      "breasts": "Silicone Gigante",
      "tattoos": "Algumas",
      "piercings": "Mamilo"
    }
  },
  {
    "id": "8",
    "name": "Flavia",
    "age": 41,
    "city": "Belo Horizonte",
    "price": "R$ 700/h",
    "rating": 4.9,
    "reviews": 36,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Mestrada na arte do prazer. Faço massagem tântrica com final feliz explosivo.",
    "services": [
      "Passeios",
      "Massagem",
      "Viagens",
      "Pernoite"
    ],
    "fetishes": [
      "Banho erótico",
      "Meias / Lingerie",
      "Roleplay / Fantasias",
      "Voyeurismo",
      "Posição 69",
      "Sexo com vendas nos olhos"
    ],
    "characteristics": {
      "hairColor": "Morena",
      "ethnicity": "Negra",
      "bodyType": "Curvilínea",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Mel",
      "breasts": "Silicone Grande",
      "tattoos": "Nenhuma",
      "piercings": "Íntimo"
    }
  },
  {
    "id": "9",
    "name": "Raquel",
    "age": 41,
    "city": "Belo Horizonte",
    "price": "R$ 350/h",
    "rating": 4.7,
    "reviews": 29,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Carinhosa, atenciosa e muito safada. O pacote completo para seu prazer.",
    "services": [
      "Passeios",
      "Jantar",
      "Eventos",
      "Cinema",
      "Festas"
    ],
    "fetishes": [
      "Pegada firme / Rough sex",
      "Masturbação mútua",
      "Beijo na boca",
      "Sadomasoquismo",
      "Roleplay / Fantasias"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Negra",
      "bodyType": "Plus Size",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Castanho",
      "breasts": "Silicone Médio",
      "tattoos": "Nenhuma",
      "piercings": "Nariz"
    }
  },
  {
    "id": "10",
    "name": "Thais",
    "age": 30,
    "city": "Brasília",
    "price": "R$ 450/h",
    "rating": 4.8,
    "reviews": 11,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Loirinha safada com carinha de anjo. As aparências enganam...",
    "services": [
      "Viagens",
      "Eventos",
      "Jantar",
      "Festas",
      "Pernoite"
    ],
    "fetishes": [
      "Striptease",
      "Brinquedos eróticos",
      "Beijo grego",
      "Posição 69",
      "Massagem tântrica",
      "Massagem erótica"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Branca",
      "bodyType": "Fitness",
      "height": "Mediana",
      "ageRange": "28–35",
      "eyes": "Mel",
      "breasts": "Silicone Grande",
      "tattoos": "Nenhuma",
      "piercings": "Nenhum"
    }
  },
  {
    "id": "11",
    "name": "Rafaela",
    "age": 43,
    "city": "Brasília",
    "price": "R$ 700/h",
    "rating": 4.8,
    "reviews": 39,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Morena fogosa, quente como o inferno. Vou te deixar de pernas bambas.",
    "services": [
      "Pernoite",
      "Eventos",
      "Jantar",
      "Massagem"
    ],
    "fetishes": [
      "Meias / Lingerie",
      "Filmagem amadora",
      "Sexo com vendas nos olhos",
      "Sexo com amarras (bondage)",
      "Massagem erótica",
      "Uniformes"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Asiática",
      "bodyType": "Natural",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Castanho",
      "breasts": "Naturais Médios",
      "tattoos": "Muitas / Fechada",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "12",
    "name": "Isabela",
    "age": 39,
    "city": "Brasília",
    "price": "R$ 350/h",
    "rating": 4.9,
    "reviews": 22,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Dominadora experiente. Vou te ensinar o verdadeiro significado de prazer e dor.",
    "services": [
      "Jantar",
      "Cinema",
      "Passeios"
    ],
    "fetishes": [
      "Beijo grego",
      "BDSM leve",
      "Masturbação mútua",
      "Posição 69"
    ],
    "characteristics": {
      "hairColor": "Colorida",
      "ethnicity": "Latina",
      "bodyType": "Magra",
      "height": "Mediana",
      "ageRange": "35+",
      "eyes": "Castanho",
      "breasts": "Silicone Médio",
      "tattoos": "Algumas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "13",
    "name": "Ana",
    "age": 44,
    "city": "Salvador",
    "price": "R$ 1000/h",
    "rating": 4.5,
    "reviews": 33,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Loirinha safada com carinha de anjo. As aparências enganam...",
    "services": [
      "Eventos",
      "Passeios",
      "Viagens",
      "Festas",
      "Jantar"
    ],
    "fetishes": [
      "Facesitting",
      "Voyeurismo",
      "Ejaculação facial",
      "Roleplay / Fantasias",
      "Massagem erótica",
      "Brinquedos eróticos"
    ],
    "characteristics": {
      "hairColor": "Preta",
      "ethnicity": "Mestiça",
      "bodyType": "Natural",
      "height": "Alta",
      "ageRange": "35+",
      "eyes": "Castanho",
      "breasts": "Naturais Pequenos",
      "tattoos": "Algumas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "14",
    "name": "Sabrina",
    "age": 20,
    "city": "Salvador",
    "price": "R$ 400/h",
    "rating": 4.7,
    "reviews": 37,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Gosto de homens que sabem o que querem. Realizo beijo grego e muito mais.",
    "services": [
      "Pernoite",
      "Eventos",
      "Massagem",
      "Jantar"
    ],
    "fetishes": [
      "Voyeurismo",
      "Oral sem camisinha (oral natural)",
      "Posição 69",
      "Sexo anal"
    ],
    "characteristics": {
      "hairColor": "Colorida",
      "ethnicity": "Asiática",
      "bodyType": "Curvilínea",
      "height": "Baixa",
      "ageRange": "18–22",
      "eyes": "Preto",
      "breasts": "Silicone Gigante",
      "tattoos": "Discretas",
      "piercings": "Umbigo"
    }
  },
  {
    "id": "15",
    "name": "Rafaela",
    "age": 45,
    "city": "Salvador",
    "price": "R$ 600/h",
    "rating": 4.6,
    "reviews": 32,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Acompanhante de alto nível para homens que buscam sexo de verdade, sem enrolação.",
    "services": [
      "Passeios",
      "Festas",
      "Massagem"
    ],
    "fetishes": [
      "Dupla penetração (DP)",
      "Ejaculação facial",
      "Uniformes"
    ],
    "characteristics": {
      "hairColor": "Loira",
      "ethnicity": "Negra",
      "bodyType": "Magra",
      "height": "Alta",
      "ageRange": "35+",
      "eyes": "Mel",
      "breasts": "Silicone Médio",
      "tattoos": "Algumas",
      "piercings": "Mamilo"
    }
  },
  {
    "id": "16",
    "name": "Beatriz",
    "age": 28,
    "city": "Fortaleza",
    "price": "R$ 800/h",
    "rating": 5.0,
    "reviews": 19,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Gosto de homens que sabem o que querem. Realizo beijo grego e muito mais.",
    "services": [
      "Cinema",
      "Massagem",
      "Viagens"
    ],
    "fetishes": [
      "Submissão",
      "Sadomasoquismo",
      "Sexo com amarras (bondage)",
      "Pegada firme / Rough sex",
      "Ejaculação facial",
      "Dominação feminina (FemDom)"
    ],
    "characteristics": {
      "hairColor": "Ruiva",
      "ethnicity": "Morena",
      "bodyType": "Plus Size",
      "height": "Mediana",
      "ageRange": "28–35",
      "eyes": "Mel",
      "breasts": "Silicone Médio",
      "tattoos": "Nenhuma",
      "piercings": "Nariz"
    }
  },
  {
    "id": "17",
    "name": "Wanessa",
    "age": 26,
    "city": "Fortaleza",
    "price": "R$ 700/h",
    "rating": 4.8,
    "reviews": 10,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Venha ter uma noite inesquecível e cheia de tesão comigo.",
    "services": [
      "Jantar",
      "Massagem",
      "Eventos"
    ],
    "fetishes": [
      "Meias / Lingerie",
      "Sadomasoquismo",
      "Facesitting",
      "Beijo na boca"
    ],
    "characteristics": {
      "hairColor": "Asiática (estilo oriental)",
      "ethnicity": "Negra",
      "bodyType": "Turbinada",
      "height": "Baixa",
      "ageRange": "23–27",
      "eyes": "Preto",
      "breasts": "Silicone Grande",
      "tattoos": "Discretas",
      "piercings": "Língua"
    }
  },
  {
    "id": "18",
    "name": "Ivana",
    "age": 19,
    "city": "Fortaleza",
    "price": "R$ 300/h",
    "rating": 4.8,
    "reviews": 36,
    "imageUrl": "/placeholder.svg?height=400&width=300",
    "isVerified": true,
    "bio": "Corpo escultural e mente perversa. Pronta para te levar ao delírio.",
    "services": [
      "Passeios",
      "Festas",
      "Eventos",
      "Cinema"
    ],
    "fetishes": [
      "Uniformes",
      "Ejaculação facial",
      "BDSM leve",
      "Oral sem camisinha (oral natural)",
      "Roleplay / Fantasias",
      "Dominação feminina (FemDom)"
    ],
    "characteristics": {
      "hairColor": "Castanha",
      "ethnicity": "Latina",
      "bodyType": "Natural",
      "height": "Alta",
      "ageRange": "18–22",
      "eyes": "Verde",
      "breasts": "Naturais Médios",
      "tattoos": "Algumas",
      "piercings": "Língua"
    }
  }
];