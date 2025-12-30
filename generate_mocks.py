import json
import random

locations = {
  'AC': { 'Rio Branco': ['Centro', 'Bosque'] },
  'AL': { 'Maceió': ['Ponta Verde', 'Jatiúca'] },
  'AP': { 'Macapá': ['Central', 'Santa Rita'] },
  'AM': { 'Manaus': ['Adrianópolis', 'Ponta Negra'] },
  'BA': { 'Salvador': ['Barra', 'Pituba', 'Rio Vermelho'] },
  'CE': { 'Fortaleza': ['Meireles', 'Aldeota'] },
  'DF': { 'Brasília': ['Asa Sul', 'Asa Norte', 'Lago Sul'] },
  'ES': { 'Vitória': ['Jardim Camburi', 'Praia do Canto'] },
  'GO': { 'Goiânia': ['Setor Marista', 'Bueno'] },
  'MA': { 'São Luís': ['Ponta D\'Areia', 'Calhau'] },
  'MT': { 'Cuiabá': ['Centro-Norte', 'Santa Rosa'] },
  'MS': { 'Campo Grande': ['Centro', 'Jardim dos Estados'] },
  'MG': { 'Belo Horizonte': ['Savassi', 'Lourdes', 'Funcionários'] },
  'PA': { 'Belém': ['Nazaré', 'Umarizal'] },
  'PB': { 'João Pessoa': ['Manaíra', 'Tambaú'] },
  'PR': { 'Curitiba': ['Batel', 'Centro Cívico'] },
  'PE': { 'Recife': ['Boa Viagem', 'Pina'] },
  'PI': { 'Teresina': ['Centro', 'Fátima'] },
  'RJ': { 'Rio de Janeiro': ['Copacabana', 'Ipanema', 'Leblon', 'Barra da Tijuca'], 'Niterói': ['Icaraí', 'Centro'] },
  'RN': { 'Natal': ['Ponta Negra', 'Petrópolis'] },
  'RO': { 'Porto Velho': ['Centro', 'Flodoaldo Pontes Pinto'] },
  'RR': { 'Boa Vista': ['Centro', 'Paraviana'] },
  'RS': { 'Porto Alegre': ['Moinhos de Vento', 'Bela Vista'] },
  'SC': { 'Florianópolis': ['Jurerê Internacional', 'Lagoa da Conceição'] },
  'SP': { 'São Paulo': ['Jardins', 'Moema', 'Pinheiros', 'Vila Olímpia', 'Morumbi'], 'Campinas': ['Centro', 'Cambuí', 'Nova Campinas'] },
  'SE': { 'Aracaju': ['Jardins', 'Atalaia'] },
  'TO': { 'Palmas': ['Plano Diretor Sul', 'Graciosa'] },
}

names = [
    "Ana", "Beatriz", "Carla", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena", "Isabela", "Julia", 
    "Larissa", "Mariana", "Natalia", "Olivia", "Paula", "Rafaela", "Sabrina", "Tatiana", "Vitoria", "Yasmin", 
    "Alice", "Bruna", "Camila", "Diana", "Elisa", "Flavia", "Giovanna", "Heloisa", "Ingrid", "Jessica", 
    "Karina", "Leticia", "Melissa", "Nicole", "Paloma", "Renata", "Sofia", "Talita", "Vanessa", "Wanessa",
    "Amanda", "Bianca", "Carolina", "Débora", "Evelyn", "Fabiana", "Gisele", "Hellen", "Ivana", "Joana",
    "Kelly", "Lorena", "Marcela", "Nayara", "Priscila", "Raquel", "Samara", "Thais", "Viviane", "Zoe"
]

services = ["Jantar", "Eventos", "Viagens", "Cinema", "Passeios", "Massagem", "Festas", "Pernoite"]

fetishes = [
    "GFE (Namoradinha)", "Dominação feminina (FemDom)", "Submissão", "BDSM leve", "Sadomasoquismo", 
    "Roleplay / Fantasias", "Pés / Podolatria", "Meias / Lingerie", "Uniformes", "Brinquedos eróticos", 
    "Sexo com vendas nos olhos", "Sexo com amarras (bondage)", "Beijo na boca", "Pegada firme / Rough sex",
    "Posição 69", "Oral sem camisinha (oral natural)", "Sexo anal", "Dupla penetração (DP)", "Banho erótico", 
    "Beijo grego", "Massagem tântrica", "Massagem erótica", "Strapon (cinto com pênis)", "Facesitting", 
    "Ejaculação facial", "Masturbação mútua", "Striptease", "Dirty talk", "Filmagem amadora", "Voyeurismo"
]

bios = [
    "Safada assumida, adoro realizar fetiches e não tenho frescuras na cama.",
    "Viciada em prazer e em proporcionar momentos intensos. Venha me usar.",
    "Corpo escultural e mente perversa. Pronta para te levar ao delírio.",
    "Adoro sexo selvagem e intenso. Se você aguenta, vem comigo.",
    "Carinhosa no trato, mas uma devassa entre quatro paredes. Faço tudo.",
    "Sua putinha de luxo. Adoro ser submissa e realizar suas fantasias mais sujas.",
    "Dominadora experiente. Vou te ensinar o verdadeiro significado de prazer e dor.",
    "Gosto de homens que sabem o que querem. Realizo beijo grego e muito mais.",
    "Sem tabus e sem limites. Uma ninfomaníaca pronta para te satisfazer.",
    "Doce por fora, mas pegando fogo por dentro. Adoro engolir tudo.",
    "Acompanhante de alto nível para homens que buscam sexo de verdade, sem enrolação.",
    "Pronta para realizar seus desejos mais ocultos e inconfessáveis.",
    "Carinhosa, atenciosa e muito safada. O pacote completo para seu prazer.",
    "Venha ter uma noite inesquecível e cheia de tesão comigo.",
    "Adoro um sexo anal bem gostoso e profundo. Vem conferir.",
    "Mestrada na arte do prazer. Faço massagem tântrica com final feliz explosivo.",
    "Bumbum gigante e guloso. Adoro levar tapas e puxões de cabelo.",
    "Loirinha safada com carinha de anjo. As aparências enganam...",
    "Morena fogosa, quente como o inferno. Vou te deixar de pernas bambas.",
    "Experiência namoradinha (GFE) com sexo intenso e muita cumplicidade."
]

characteristics_options = {
  "hairColor": [
    "Loira",
    "Morena",
    "Ruiva",
    "Preta",
    "Castanha",
    "Colorida",
    "Asiática (estilo oriental)"
  ],
  "ethnicity": [
    "Branca",
    "Morena",
    "Negra",
    "Asiática",
    "Mestiça",
    "Latina"
  ],
  "bodyType": [
    "Magra",
    "Curvilínea",
    "Fitness",
    "Plus Size",
    "Natural",
    "Turbinada"
  ],
  "height": [
    "Baixa",
    "Mediana",
    "Alta"
  ],
  "ageRange": [
    "18–22",
    "23–27",
    "28–35",
    "35+"
  ],
  "eyes": [
    "Azul",
    "Verde",
    "Castanho",
    "Preto",
    "Mel"
  ],
  "breasts": [
    "Naturais Pequenos",
    "Naturais Médios",
    "Naturais Grandes",
    "Silicone Médio",
    "Silicone Grande",
    "Silicone Gigante"
  ],
  "tattoos": [
    "Nenhuma",
    "Discretas",
    "Algumas",
    "Muitas / Fechada"
  ],
  "piercings": [
    "Nenhum",
    "Umbigo",
    "Nariz",
    "Língua",
    "Mamilo",
    "Íntimo",
    "Vários"
  ]
}

# Mapping age range to actual age numbers for consistency
age_map = {
    "18–22": (18, 22),
    "23–27": (23, 27),
    "28–35": (28, 35),
    "35+": (36, 45)
}

profiles = []
model_id = 1

# Collect all cities
target_cities = [
    "São Paulo",
    "Rio de Janeiro",
    "Belo Horizonte",
    "Brasília",
    "Salvador",
    "Fortaleza"
]

for city in target_cities:
    for _ in range(3):
        name = random.choice(names)
        age_range_label = random.choice(characteristics_options["ageRange"])
        min_age, max_age = age_map[age_range_label]
        age = random.randint(min_age, max_age)
        
        price = f"R$ {random.choice([300, 350, 400, 450, 500, 600, 700, 800, 1000])}/h"
        rating = round(random.uniform(4.5, 5.0), 1)
        reviews = random.randint(5, 50)
        
        model_services = random.sample(services, k=random.randint(3, 5))
        model_fetishes = random.sample(fetishes, k=random.randint(3, 6))
        bio = random.choice(bios)
        
        chars = {
            "hairColor": random.choice(characteristics_options["hairColor"]),
            "ethnicity": random.choice(characteristics_options["ethnicity"]),
            "bodyType": random.choice(characteristics_options["bodyType"]),
            "height": random.choice(characteristics_options["height"]),
            "ageRange": age_range_label,
            "eyes": random.choice(characteristics_options["eyes"]),
            "breasts": random.choice(characteristics_options["breasts"]),
            "tattoos": random.choice(characteristics_options["tattoos"]),
            "piercings": random.choice(characteristics_options["piercings"])
        }
        
        profile = {
            "id": str(model_id),
            "name": name,
            "age": age,
            "city": city,
            "price": price,
            "rating": rating,
            "reviews": reviews,
            "imageUrl": "/placeholder.svg?height=400&width=300",
            "isVerified": True,
            "bio": bio,
            "services": model_services,
            "fetishes": model_fetishes,
            "characteristics": chars
        }
        profiles.append(profile)
        model_id += 1

# Generate TS output
output = []
output.append('import { Model } from "@/components/model-details-modal";')
output.append('')
output.append('// Extend Model interface to include physical characteristics')
output.append('export interface ModelWithCharacteristics extends Model {')
output.append('  characteristics?: {')
output.append('    hairColor?: string;')
output.append('    ethnicity?: string;')
output.append('    bodyType?: string;')
output.append('    height?: string;')
output.append('    ageRange?: string;')
output.append('    eyes?: string;')
output.append('    breasts?: string;')
output.append('    tattoos?: string;')
output.append('    piercings?: string;')
output.append('  };')
output.append('}')
output.append('')
output.append('export const mockProfiles: ModelWithCharacteristics[] = ' + json.dumps(profiles, indent=2, ensure_ascii=False) + ';')

with open('lib/mock-profiles.ts', 'w', encoding='utf-8') as f:
    f.write('\n'.join(output))