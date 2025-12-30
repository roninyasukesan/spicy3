export const PHYSICAL_CHARACTERISTICS = {
  hairColor: {
    label: "Cor do Cabelo",
    options: [
      "Loira",
      "Morena",
      "Ruiva",
      "Preta",
      "Castanha",
      "Colorida",
      "Asiática (estilo oriental)"
    ]
  },
  ethnicity: {
    label: "Pele / Etnia",
    options: [
      "Branca",
      "Morena",
      "Negra",
      "Asiática",
      "Mestiça",
      "Latina"
    ]
  },
  bodyType: {
    label: "Tipo de Corpo",
    options: [
      "Magra",
      "Curvilínea",
      "Fitness",
      "Plus Size",
      "Natural",
      "Turbinada"
    ]
  },
  height: {
    label: "Altura",
    options: [
      "Baixa",
      "Mediana",
      "Alta"
    ]
  },
  age: {
    label: "Idade",
    options: [
      "18–22",
      "23–27",
      "28–35",
      "35+"
    ]
  },
  eyes: {
    label: "Olhos",
    options: [
      "Azul",
      "Verde",
      "Castanho",
      "Preto",
      "Mel"
    ]
  },
  breasts: {
    label: "Seios",
    options: [
      "Naturais Pequenos",
      "Naturais Médios",
      "Naturais Grandes",
      "Silicone Médio",
      "Silicone Grande",
      "Silicone Gigante"
    ]
  },
  tattoos: {
    label: "Tatuagens",
    options: [
      "Nenhuma",
      "Discretas",
      "Algumas",
      "Muitas / Fechada"
    ]
  },
  piercings: {
    label: "Piercings",
    options: [
      "Nenhum",
      "Umbigo",
      "Nariz",
      "Língua",
      "Mamilo",
      "Íntimo",
      "Vários"
    ]
  }
} as const;

export type PhysicalCharacteristics = typeof PHYSICAL_CHARACTERISTICS;

