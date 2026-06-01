import { type UserRole } from "@/lib/utils"

export type LocalUser = {
  id?: string
  email: string
  role: UserRole
  name: string
  plan?: "free" | "vip"
  subscribedModelIds?: string[]
}

type LocalUserWithPassword = LocalUser & {
  password: string
}

export type DemoUser = LocalUserWithPassword

const STORAGE_KEY = "spicy-auth-user"
const HOME_CONTENT_KEY = "spicy-home-content"
const USERS_STORAGE_KEY = "spicy-users-list"

const LOCAL_USERS: LocalUserWithPassword[] = [
  {
    email: "admin@email.com",
    password: "admin1",
    role: "admin",
    name: "Admin",
  },
  {
    email: "modelo@email.com",
    password: "modelo1",
    role: "modelo",
    name: "Modelo",
  },
  {
    email: "cliente@email.com",
    password: "cliente1",
    role: "cliente",
    name: "Cliente",
  },
  {
    email: "vip@email.com",
    password: "vip1",
    role: "cliente",
    name: "VIP",
    plan: "vip",
  },
  // Real Mock Users
  {
    email: "laura@spicy.com",
    password: "123",
    role: "modelo",
    name: "Laura Diamond",
  },
  {
    email: "isabella@spicy.com",
    password: "123",
    role: "modelo",
    name: "Isabella Gold",
  },
  {
    email: "sophia@spicy.com",
    password: "123",
    role: "modelo",
    name: "Sophia Ruby",
  },
  {
    email: "valentina@spicy.com",
    password: "123",
    role: "modelo",
    name: "Valentina",
  },
]

const SEED_PROFILES: Record<string, ModelProfile> = {
  "laura@spicy.com": {
    artisticName: "Laura Diamond",
    phone: "11999999999",
    city: "São Paulo",
    age: "23",
    bio: "Adoro conhecer pessoas novas e proporcionar momentos inesquecíveis. Sou carinhosa, atenciosa e muito divertida.",
    services: ["Jantar", "Cinema", "Viagens curtas"],
    fetishes: [],
    exclusions: [],
    priceRange: "R$ 500/h",
    characteristics: {
      hairColor: "Loiro",
      ethnicity: "Branca",
      bodyType: "Curvilínea",
      height: "1.70m",
      age: "23",
      eyes: "Azuis",
      breasts: "Médios",
      tattoos: "Sim",
      piercings: "Não"
    },
    photos: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    coverImage: "/placeholder.svg?height=400&width=300",
    stories: [
      {
        id: "s1",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Story+1",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: "s2",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Story+2",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      }
    ]
  },
  "isabella@spicy.com": {
    artisticName: "Isabella Gold",
    phone: "21999999999",
    city: "Rio de Janeiro",
    age: "25",
    bio: "Sofisticação e beleza em cada detalhe. Venha viver uma experiência de alto nível.",
    services: ["Eventos", "Jantar de negócios", "Viagens internacionais"],
    fetishes: [],
    exclusions: [],
    priceRange: "R$ 650/h",
    characteristics: {
      hairColor: "Morena",
      ethnicity: "Parda",
      bodyType: "Fitness",
      height: "1.75m",
      age: "25",
      eyes: "Castanhos",
      breasts: "Grandes",
      tattoos: "Não",
      piercings: "Sim"
    },
    photos: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    coverImage: "/placeholder.svg?height=400&width=300",
    stories: [
      {
        id: "s_isa1",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Isabella+VIP",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: "s_isa2",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Isabella+Party",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      }
    ]
  },
  "sophia@spicy.com": {
    artisticName: "Sophia Ruby",
    phone: "31999999999",
    city: "Belo Horizonte",
    age: "21",
    bio: "Doce e encantadora, pronta para ser sua melhor companhia.",
    services: ["Cinema", "Passeios", "Jantar"],
    fetishes: [],
    exclusions: [],
    priceRange: "R$ 400/h",
    characteristics: {
      hairColor: "Ruiva",
      ethnicity: "Branca",
      bodyType: "Magra",
      height: "1.65m",
      age: "21",
      eyes: "Verdes",
      breasts: "Pequenos",
      tattoos: "Sim",
      piercings: "Sim"
    },
    photos: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    coverImage: "/placeholder.svg?height=400&width=300",
    stories: [
      {
        id: "s_sophia1",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Sophia+Story+1",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: "s_sophia2",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Sophia+Story+2",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      }
    ]
  },
  "valentina@spicy.com": {
    artisticName: "Valentina",
    phone: "21988888888",
    city: "Rio de Janeiro",
    age: "27",
    bio: "Experiência e elegância para momentos especiais.",
    services: ["Acompanhante", "Eventos"],
    fetishes: [],
    exclusions: [],
    priceRange: "R$ 550/h",
    characteristics: {
      hairColor: "Preto",
      ethnicity: "Negra",
      bodyType: "Curvilínea",
      height: "1.72m",
      age: "27",
      eyes: "Pretos",
      breasts: "Médios",
      tattoos: "Não",
      piercings: "Não"
    },
    photos: [
      "/placeholder.svg?height=400&width=300",
    ],
    coverImage: "/placeholder.svg?height=400&width=300",
    stories: [
      {
        id: "s_val1",
        mediaUrl: "/placeholder.svg?height=800&width=450&text=Valentina+Backstage",
        mediaType: "image",
        duration: 5,
        createdAt: new Date().toISOString()
      }
    ]
  }
}

export const demoUsers: DemoUser[] = LOCAL_USERS.map(user => ({ ...user }))

export function getUsers(): DemoUser[] {
  if (typeof window === "undefined") return LOCAL_USERS
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY)
  if (!raw) return LOCAL_USERS
  try {
    return JSON.parse(raw) as DemoUser[]
  } catch {
    return LOCAL_USERS
  }
}

export function addUser(user: DemoUser) {
  if (typeof window === "undefined") return
  const users = getUsers()
  if (users.find(u => u.email === user.email)) {
    throw new Error("Usuário já existe")
  }
  const newUsers = [...users, user]
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers))
  return newUsers
}

export function removeUser(email: string) {
  if (typeof window === "undefined") return
  const users = getUsers()
  const newUsers = users.filter(u => u.email !== email)
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers))
  return newUsers
}

export function updateUserPlan(email: string, plan: "free" | "vip") {
  if (typeof window === "undefined") return
  const users = getUsers()
  const newUsers = users.map(user => {
    if (user.email !== email) return user
    return {
      ...user,
      plan,
    }
  })
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers))
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const current = JSON.parse(raw) as LocalUser
      if (current.email === email) {
        const next = { ...current, plan }
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event("spicy-auth-change"))
      }
    } catch {}
  }
  return newUsers
}

export async function localSignIn(email: string, password: string): Promise<{ user: LocalUser }> {
  const normalizedEmail = email.trim().toLowerCase()
  const users = getUsers()
  
  const userExists = users.find(u => u.email.toLowerCase() === normalizedEmail)
  
  if (!userExists) {
    throw new Error("Usuário não encontrado.")
  }

  const match = users.find(
    user => user.email.toLowerCase() === normalizedEmail && user.password === password
  )

  if (!match) {
    throw new Error("Senha incorreta. Tente novamente.")
  }

  const user: LocalUser = {
    email: match.email,
    role: match.role,
    name: match.name,
    plan: match.plan,
    subscribedModelIds: match.subscribedModelIds || []
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    window.dispatchEvent(new Event("spicy-auth-change"))
  }

  return { user }
}

export function localGetUser(): LocalUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LocalUser
  } catch {
    return null
  }
}

export function localSignOut() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event("spicy-auth-change"))
}

export type HomeContent = {
  heroTitle: string
  heroSubtitle: string
  shortcutSearchTitle: string
  shortcutSearchDesc: string
  shortcutVipTitle: string
  shortcutVipDesc: string
  shortcutAdvertiseTitle: string
  shortcutAdvertiseDesc: string
}

const defaultHomeContent: HomeContent = {
  heroTitle: "Encontre Modelos de Luxo",
  heroSubtitle: "Descubra experiências premium com segurança, discrição e confiança.",
  shortcutSearchTitle: "Buscar Modelos",
  shortcutSearchDesc: "Encontre a modelo ideal para seus desejos.",
  shortcutVipTitle: "Assine VIP",
  shortcutVipDesc: "Desbloqueie recursos exclusivos e acesso ilimitado.",
  shortcutAdvertiseTitle: "Anuncie Aqui",
  shortcutAdvertiseDesc: "Seja uma modelo de luxo e monetize seu talento.",
}

export function getHomeContent(): HomeContent {
  if (typeof window === "undefined") return defaultHomeContent
  const raw = window.localStorage.getItem(HOME_CONTENT_KEY)
  if (!raw) return defaultHomeContent
  try {
    const parsed = JSON.parse(raw) as Partial<HomeContent>
    return {
      ...defaultHomeContent,
      ...parsed,
    }
  } catch {
    return defaultHomeContent
  }
}

export function setHomeContent(updates: Partial<HomeContent>): HomeContent {
  if (typeof window === "undefined") {
    return {
      ...defaultHomeContent,
      ...updates,
    }
  }
  const current = getHomeContent()
  const next: HomeContent = {
    ...current,
    ...updates,
  }
  window.localStorage.setItem(HOME_CONTENT_KEY, JSON.stringify(next))
  return next
}

export type ModelProfile = {
  artisticName: string
  phone: string
  city: string
  age: string
  bio: string
  services: string[]
  fetishes: string[]
  exclusions: string[]
  priceRange: string
  characteristics: {
    hairColor: string
    ethnicity: string
    bodyType: string
    height: string
    age: string
    eyes: string
    breasts: string
    tattoos: string
    piercings: string
  }
  photos?: string[]
  coverImage?: string
  voiceUrl?: string
  email?: string
  stories?: Story[]
}

export type Story = {
  id: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  duration?: number // in seconds, default 5s for images
  createdAt: string
  thumbnailUrl?: string // for videos
}

const MODEL_PROFILE_KEY = "spicy-model-profile"

export function getModelProfile(email: string): ModelProfile | null {
  // Check local storage first
  if (typeof window !== "undefined") {
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    if (allProfilesRaw) {
      try {
        const allProfiles = JSON.parse(allProfilesRaw)
        if (allProfiles[email]) {
          // Merge with seed to ensure new fields (like stories) appear if not in local yet
          const seed = SEED_PROFILES[email] || {}
          return { ...seed, ...allProfiles[email], email }
        }
      } catch {
        // ignore error
      }
    }
  }

  // Fallback to seed profiles
  if (SEED_PROFILES[email]) {
    return { ...SEED_PROFILES[email], email } // Ensure email is attached
  }

  return null
}

export function saveModelProfile(email: string, profile: ModelProfile) {
  if (typeof window === "undefined") return
  const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
  const allProfiles = allProfilesRaw ? JSON.parse(allProfilesRaw) : {}
  allProfiles[email] = { ...profile, email } // Ensure email is saved within profile if needed for search
  window.localStorage.setItem(MODEL_PROFILE_KEY, JSON.stringify(allProfiles))
  // Notify any mounted listeners (profile lists, search, stories) to refresh
  window.dispatchEvent(new Event("spicy-profile-change"))
}

export function getAllLocalProfiles(): (ModelProfile & { email: string })[] {
  const profilesMap: Record<string, ModelProfile & { email: string }> = {}

  // 1. Add seed profiles
  Object.keys(SEED_PROFILES).forEach(email => {
    profilesMap[email] = { ...SEED_PROFILES[email], email }
  })

  // 2. Override with local storage profiles (merging to keep new seed fields)
  if (typeof window !== "undefined") {
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    if (allProfilesRaw) {
      try {
        const localProfiles = JSON.parse(allProfilesRaw)
        Object.keys(localProfiles).forEach(email => {
          // If profile exists in seed, merge. If not (new user), just use local.
          if (profilesMap[email]) {
            profilesMap[email] = { ...profilesMap[email], ...localProfiles[email], email }
          } else {
            profilesMap[email] = { ...localProfiles[email], email }
          }
        })
      } catch {
        // ignore error
      }
    }
  }

  return Object.values(profilesMap)
}
