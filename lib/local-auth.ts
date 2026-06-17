import { type UserRole, slugify } from "@/lib/utils"
import { mockProfiles } from "./mock-profiles"

export type LocalUser = {
  id?: string
  publicProfileId?: string
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
const DELETED_USERS_STORAGE_KEY = "spicy-deleted-users"
const DELETED_MODEL_PROFILES_STORAGE_KEY = "spicy-deleted-model-profiles"

function safeSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (error instanceof Error && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      return false
    }

    console.error(`Failed to save to localStorage [${key}]:`, error)
    return false
  }
}

function getSerializedByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export const LOCAL_USERS: LocalUserWithPassword[] = [
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

type MockEmailMapping = {
  id: string
  name: string
  email: string
  legacyEmail: string
}

function buildMockEmailMappings(): MockEmailMapping[] {
  const usedEmails = new Set<string>()

  return mockProfiles.map((profile) => {
    const baseLocalPart = slugify(profile.name).replace(/-/g, "") || `mock${profile.id}`
    let localPart = baseLocalPart

    if (usedEmails.has(localPart)) {
      localPart = `${baseLocalPart}${profile.id}`
    }

    usedEmails.add(localPart)

    return {
      id: profile.id,
      name: profile.name,
      email: `${localPart}@spicy.com`,
      legacyEmail: `mock${profile.id}@spicy.com`,
    }
  })
}

function resolveMockEmail(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  const mapping = buildMockEmailMappings().find(
    (item) => item.legacyEmail.toLowerCase() === normalizedEmail || item.email.toLowerCase() === normalizedEmail
  )

  return mapping?.email || normalizedEmail
}

function buildDefaultDemoUsers(): DemoUser[] {
  const usersMap = new Map<string, DemoUser>()

  LOCAL_USERS.forEach((user) => {
    usersMap.set(user.email.toLowerCase(), { ...user })
  })

  buildMockEmailMappings().forEach((profile) => {
    const email = profile.email

    if (!usersMap.has(email.toLowerCase())) {
      usersMap.set(email.toLowerCase(), {
        email,
        password: "123",
        role: "modelo",
        name: profile.name,
      })
    }
  })

  return Array.from(usersMap.values())
}

export const demoUsers: DemoUser[] = buildDefaultDemoUsers()

function normalizeUserEmail(email: string) {
  return resolveMockEmail(email.trim().toLowerCase())
}

function getDeletedUserEmails() {
  if (typeof window === "undefined") return new Set<string>()

  try {
    const raw = window.localStorage.getItem(DELETED_USERS_STORAGE_KEY)
    const emails = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(emails.map(normalizeUserEmail))
  } catch {
    return new Set<string>()
  }
}

function notifyUsersChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("spicy-users-change"))
  }
}

function getDeletedModelProfileEmails() {
  if (typeof window === "undefined") return new Set<string>()

  try {
    const raw = window.localStorage.getItem(DELETED_MODEL_PROFILES_STORAGE_KEY)
    const emails = raw ? (JSON.parse(raw) as string[]) : []
    return new Set(emails.map(normalizeUserEmail))
  } catch {
    return new Set<string>()
  }
}

export function isModelProfileDeleted(email: string) {
  return getDeletedModelProfileEmails().has(resolveMockEmail(email))
}

export function getUsers(): DemoUser[] {
  const defaultUsers = buildDefaultDemoUsers()
  if (typeof window === "undefined") return defaultUsers
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY)
  const deletedEmails = getDeletedUserEmails()
  const usersMap = new Map<string, DemoUser>()

  defaultUsers.forEach((user) => {
    const email = normalizeUserEmail(user.email)
    if (!deletedEmails.has(email)) {
      usersMap.set(email, { ...user, email })
    }
  })

  if (!raw) return Array.from(usersMap.values())

  try {
    const storedUsers = JSON.parse(raw) as DemoUser[]

    storedUsers.forEach((user) => {
      const resolvedEmail = normalizeUserEmail(user.email)
      if (deletedEmails.has(resolvedEmail)) return

      usersMap.set(resolvedEmail, {
        ...user,
        email: resolvedEmail,
      })
    })

    return Array.from(usersMap.values())
  } catch {
    return Array.from(usersMap.values())
  }
}

export function getPersistedLocalUsers(): DemoUser[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY)
    if (!raw) return []
    const users = JSON.parse(raw)
    return Array.isArray(users) ? (users as DemoUser[]) : []
  } catch {
    return []
  }
}

export function addUser(user: DemoUser) {
  if (typeof window === "undefined") return []

  const normalizedUser: DemoUser = {
    ...user,
    id: user.id || createPublicProfileId(),
    publicProfileId:
      user.role === "modelo"
        ? user.publicProfileId || createPublicProfileId()
        : undefined,
    name: user.name.trim(),
    email: normalizeUserEmail(user.email),
    password: user.password.trim(),
    plan: user.role === "cliente" ? user.plan || "free" : undefined,
  }

  if (!normalizedUser.name) {
    throw new Error("Informe o nome do usuário.")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedUser.email)) {
    throw new Error("Informe um e-mail válido.")
  }
  if (normalizedUser.password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.")
  }

  const users = getUsers()
  if (users.some((existingUser) => normalizeUserEmail(existingUser.email) === normalizedUser.email)) {
    throw new Error("Já existe um usuário com este e-mail.")
  }

  const deletedEmails = getDeletedUserEmails()
  deletedEmails.delete(normalizedUser.email)

  const newUsers = [...users, normalizedUser]
  if (
    !safeSetItem(USERS_STORAGE_KEY, JSON.stringify(newUsers)) ||
    !safeSetItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(Array.from(deletedEmails)))
  ) {
    throw new Error("Não foi possível salvar o usuário no navegador.")
  }

  if (normalizedUser.role === "modelo" && !getModelProfile(normalizedUser.email)) {
    const profileSaved = saveModelProfile(normalizedUser.email, {
      publicId: normalizedUser.publicProfileId,
      artisticName: normalizedUser.name,
      phone: "",
      city: "",
      age: "",
      bio: "",
      services: [],
      fetishes: [],
      exclusions: [],
      priceRange: "",
      characteristics: {
        hairColor: "",
        ethnicity: "",
        bodyType: "",
        height: "",
        age: "",
        eyes: "",
        breasts: "",
        tattoos: "",
        piercings: "",
      },
      photoItems: [],
      photos: [],
      stories: [],
    })

    if (!profileSaved) {
      throw new Error("A conta foi criada, mas o perfil local não pôde ser iniciado.")
    }
  }

  notifyUsersChanged()
  return newUsers
}

export function cacheRemoteUsers(remoteUsers: DemoUser[]) {
  if (typeof window === "undefined") return []

  const currentUsers = getUsers()
  const usersByEmail = new Map(
    currentUsers.map((user) => [normalizeUserEmail(user.email), user])
  )

  remoteUsers.forEach((remoteUser) => {
    const email = normalizeUserEmail(remoteUser.email)
    const existing = usersByEmail.get(email)
    usersByEmail.set(email, {
      ...existing,
      ...remoteUser,
      email,
      password: existing?.password || remoteUser.password || "",
    })
  })

  const users = Array.from(usersByEmail.values())
  if (!safeSetItem(USERS_STORAGE_KEY, JSON.stringify(users))) {
    throw new Error("Não foi possível atualizar o cache local de usuários.")
  }

  notifyUsersChanged()
  return users
}

export function removeUser(email: string) {
  if (typeof window === "undefined") return []

  const normalizedEmail = normalizeUserEmail(email)
  if (normalizedEmail === "admin@email.com") {
    throw new Error("Não é possível remover o administrador principal.")
  }

  const users = getUsers()
  const userToRemove = users.find(
    (user) => normalizeUserEmail(user.email) === normalizedEmail
  )
  if (!userToRemove) {
    throw new Error("Usuário não encontrado.")
  }

  const newUsers = users.filter(
    (user) => normalizeUserEmail(user.email) !== normalizedEmail
  )
  const deletedEmails = getDeletedUserEmails()
  deletedEmails.add(normalizedEmail)

  if (
    !safeSetItem(USERS_STORAGE_KEY, JSON.stringify(newUsers)) ||
    !safeSetItem(DELETED_USERS_STORAGE_KEY, JSON.stringify(Array.from(deletedEmails)))
  ) {
    throw new Error("Não foi possível remover o usuário do navegador.")
  }

  if (userToRemove.role === "modelo") {
    removeModelProfile(normalizedEmail)
  }

  notifyUsersChanged()
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
  if (!safeSetItem(USERS_STORAGE_KEY, JSON.stringify(newUsers))) {
    throw new Error("Não foi possível atualizar o plano do usuário.")
  }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const current = JSON.parse(raw) as LocalUser
      if (current.email === email) {
        const next = { ...current, plan }
        safeSetItem(STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event("spicy-auth-change"))
      }
    } catch {}
  }
  notifyUsersChanged()
  return newUsers
}

export async function localSignIn(email: string, password: string): Promise<{ user: LocalUser }> {
  const normalizedEmail = resolveMockEmail(email)
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
    id: match.id,
    publicProfileId: match.publicProfileId,
    email: match.email,
    role: match.role,
    name: match.name,
    plan: match.plan,
    subscribedModelIds: match.subscribedModelIds || []
  }

  if (typeof window !== "undefined") {
    safeSetItem(STORAGE_KEY, JSON.stringify(user))
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

export function cacheAuthenticatedUser(user: LocalUser) {
  if (typeof window === "undefined") return
  safeSetItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event("spicy-auth-change"))
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
  safeSetItem(HOME_CONTENT_KEY, JSON.stringify(next))
  return next
}

export type ModelProfile = {
  publicId?: string
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
  photoItems?: ModelPhoto[]
  coverImage?: string
  voiceUrl?: string
  email?: string
  stories?: Story[]
}

export type ModelPhoto = {
  id: string
  url: string
  isBlurred?: boolean
  mediaType?: "image" | "video"
}

export type Story = {
  id: string
  mediaUrl: string
  mediaType: 'image' | 'video'
  duration?: number // in seconds, default 5s for images
  createdAt: string
  thumbnailUrl?: string // for videos
  isBlurred?: boolean
}

const MODEL_PROFILE_KEY = "spicy-model-profile"
const MODEL_PROFILE_CHANNEL = "spicy-profile-updates"

export function createPublicProfileId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  const randomBytes = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
  )
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80
  const hex = randomBytes.map((value) => value.toString(16).padStart(2, "0"))

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-")
}

export function subscribeToModelProfileChanges(callback: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleProfileChange = () => callback()
  const handleStorageChange = (event: StorageEvent) => {
    if (!event.key || event.key === MODEL_PROFILE_KEY) callback()
  }
  const channel =
    typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(MODEL_PROFILE_CHANNEL)
      : null

  window.addEventListener("spicy-profile-change", handleProfileChange)
  window.addEventListener("storage", handleStorageChange)
  if (channel) channel.onmessage = handleProfileChange

  return () => {
    window.removeEventListener("spicy-profile-change", handleProfileChange)
    window.removeEventListener("storage", handleStorageChange)
    channel?.close()
  }
}

function notifyModelProfileChanged(email: string) {
  if (typeof window === "undefined") return

  window.dispatchEvent(
    new CustomEvent("spicy-profile-change", {
      detail: { email },
    })
  )

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(MODEL_PROFILE_CHANNEL)
    channel.postMessage({ email, updatedAt: Date.now() })
    channel.close()
  }
}

export function removeModelProfile(email: string) {
  if (typeof window === "undefined") return false

  const resolvedEmail = resolveMockEmail(email)
  const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
  let allProfiles: Record<string, ModelProfile> = {}

  if (allProfilesRaw) {
    try {
      allProfiles = JSON.parse(allProfilesRaw)
    } catch {
      allProfiles = {}
    }
  }

  delete allProfiles[resolvedEmail]
  Object.keys(allProfiles).forEach((storedEmail) => {
    if (resolveMockEmail(storedEmail) === resolvedEmail) {
      delete allProfiles[storedEmail]
    }
  })

  const deletedProfiles = getDeletedModelProfileEmails()
  deletedProfiles.add(resolvedEmail)

  if (
    !safeSetItem(MODEL_PROFILE_KEY, JSON.stringify(allProfiles)) ||
    !safeSetItem(
      DELETED_MODEL_PROFILES_STORAGE_KEY,
      JSON.stringify(Array.from(deletedProfiles))
    )
  ) {
    throw new Error("Não foi possível excluir o perfil da modelo.")
  }

  notifyModelProfileChanged(resolvedEmail)
  return true
}

function createPhotoId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizePhotoItem(
  photo: string | Partial<ModelPhoto> | null | undefined,
  index: number
): ModelPhoto | null {
  if (!photo) return null

  if (typeof photo === "string") {
    return {
      id: `legacy-${index}-${photo.slice(0, 16)}`,
      url: photo,
      isBlurred: false,
      mediaType: "image",
    }
  }

  if (!photo.url) return null

  return {
    id: photo.id || createPhotoId(),
    url: photo.url,
    isBlurred: Boolean(photo.isBlurred),
    mediaType: photo.mediaType === "video" ? "video" : "image",
  }
}

export function getProfilePhotoItems(profile?: Partial<ModelProfile> | null): ModelPhoto[] {
  if (!profile) return []

  const sourcePhotos =
    profile.photoItems && profile.photoItems.length > 0 ? profile.photoItems : profile.photos || []

  return sourcePhotos
    .map((photo, index) => normalizePhotoItem(photo, index))
    .filter((photo): photo is ModelPhoto => Boolean(photo))
}

export function getProfilePhotoUrls(profile?: Partial<ModelProfile> | null): string[] {
  return getProfilePhotoItems(profile).map((photo) => photo.url)
}

export function getProfileCoverImage(profile?: Partial<ModelProfile> | null): string | undefined {
  return getProfilePhotoItems(profile)[0]?.url || profile?.coverImage || profile?.photos?.[0]
}

export function normalizeModelProfile<T extends ModelProfile>(
  profile: T
): T & ModelProfile {
  const photoItems = getProfilePhotoItems(profile)

  return {
    ...profile,
    photoItems,
    photos: photoItems.map((photo) => photo.url),
    coverImage: photoItems[0]?.url || profile.coverImage,
  } as T & ModelProfile
}

export function getModelProfile(id: string): ModelProfile | null {
  // 1. Try to find by email
  let email = resolveMockEmail(id);
  
  // If id is not an email, it might be a public UUID or a legacy slug.
  if (!id.includes("@")) {
    const allProfiles = getAllLocalProfiles();
    const found = allProfiles.find(
      p => p.publicId === id || slugify(p.artisticName) === id
    );
    if (found) {
      email = found.email;
    } else {
      // If not found by slug, and not an email, return null
      return null;
    }
  }

  if (isModelProfileDeleted(email)) {
    return null
  }

  // Check local storage first
  if (typeof window !== "undefined") {
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    if (allProfilesRaw) {
      try {
        const allProfiles = JSON.parse(allProfilesRaw)
        if (allProfiles[email]) {
          // Merge with seed to ensure new fields (like stories) appear if not in local yet
          const seed = SEED_PROFILES[email] || {}
          return normalizeModelProfile({ ...seed, ...allProfiles[email], email })
        }
      } catch {
        // ignore error
      }
    }
  }

  // Fallback to seed profiles
  if (SEED_PROFILES[email]) {
    return normalizeModelProfile({ ...SEED_PROFILES[email], email }) // Ensure email is attached
  }

  return null
}

export function saveModelProfile(email: string, profile: ModelProfile) {
  if (typeof window === "undefined") return
  try {
    const resolvedEmail = resolveMockEmail(email)
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    let allProfiles: Record<string, ModelProfile> = {}
    
    if (allProfilesRaw) {
      try {
        allProfiles = JSON.parse(allProfilesRaw)
      } catch (e) {
        console.error("Failed to parse profiles from localStorage:", e)
        allProfiles = {}
      }
    }
    
    const publicId =
      profile.publicId ||
      allProfiles[resolvedEmail]?.publicId ||
      createPublicProfileId()
    allProfiles[resolvedEmail] = normalizeModelProfile({
      ...profile,
      publicId,
      email: resolvedEmail,
    })
    const deletedProfiles = getDeletedModelProfileEmails()
    deletedProfiles.delete(resolvedEmail)
    const saved =
      safeSetItem(MODEL_PROFILE_KEY, JSON.stringify(allProfiles)) &&
      safeSetItem(
        DELETED_MODEL_PROFILES_STORAGE_KEY,
        JSON.stringify(Array.from(deletedProfiles))
      )

    if (saved) {
      notifyModelProfileChanged(resolvedEmail)
    }

    return saved
  } catch (error) {
    if (error instanceof Error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      return false
    }

    console.error("Failed to save model profile to localStorage:", error)
    return false
  }
}

export function estimateModelProfileStorageSize(email: string, profile: ModelProfile): number {
  if (typeof window === "undefined") return 0

  try {
    const resolvedEmail = resolveMockEmail(email)
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    let allProfiles: Record<string, ModelProfile> = {}

    if (allProfilesRaw) {
      try {
        allProfiles = JSON.parse(allProfilesRaw)
      } catch {
        allProfiles = {}
      }
    }

    allProfiles[resolvedEmail] = normalizeModelProfile({ ...profile, email: resolvedEmail })
    return getSerializedByteLength(JSON.stringify(allProfiles))
  } catch (error) {
    console.error("Failed to estimate model profile storage size:", error)
    return 0
  }
}

export function getAllLocalProfiles(): (ModelProfile & { email: string })[] {
  const profilesMap: Record<string, ModelProfile & { email: string }> = {}
  const mockEmailMappings = buildMockEmailMappings()
  const deletedProfiles = getDeletedModelProfileEmails()

  // 1. Add mock profiles from mock-profiles.ts
  mockProfiles.forEach(mp => {
    const mapping = mockEmailMappings.find((item) => item.id === mp.id)
    const email = mapping?.email || `mock${mp.id}@spicy.com`
    if (deletedProfiles.has(resolveMockEmail(email))) return
    
    // Check if we have a seed for this specific name/email to get stories/photos
    const seedMatch = Object.values(SEED_PROFILES).find(s => 
      s.artisticName.toLowerCase().includes(mp.name.toLowerCase())
    );

    profilesMap[email] = normalizeModelProfile({
      artisticName: mp.name,
      phone: seedMatch?.phone || "",
      city: mp.city,
      age: mp.age.toString(),
      bio: mp.bio || seedMatch?.bio || "",
      services: mp.services || seedMatch?.services || [],
      fetishes: mp.fetishes || seedMatch?.fetishes || [],
      exclusions: [],
      priceRange: mp.price,
      characteristics: {
        hairColor: mp.characteristics?.hairColor || seedMatch?.characteristics.hairColor || "Morena",
        ethnicity: mp.characteristics?.ethnicity || seedMatch?.characteristics.ethnicity || "Branca",
        bodyType: mp.characteristics?.bodyType || seedMatch?.characteristics.bodyType || "Curvilínea",
        height: mp.characteristics?.height || seedMatch?.characteristics.height || "1.70m",
        age: mp.age.toString(),
        eyes: mp.characteristics?.eyes || seedMatch?.characteristics.eyes || "Castanho",
        breasts: mp.characteristics?.breasts || seedMatch?.characteristics.breasts || "Médios",
        tattoos: mp.characteristics?.tattoos || seedMatch?.characteristics.tattoos || "Não",
        piercings: mp.characteristics?.piercings || seedMatch?.characteristics.piercings || "Não"
      },
      photos: mp.gallery || seedMatch?.photos || [mp.imageUrl],
      coverImage: mp.imageUrl || seedMatch?.coverImage,
      email: email,
      stories: seedMatch?.stories || []
    });
  })

  // 2. Add seed profiles (overriding if same email, but they are different)
  Object.keys(SEED_PROFILES).forEach(email => {
    if (deletedProfiles.has(resolveMockEmail(email))) return
    profilesMap[email] = normalizeModelProfile({ ...SEED_PROFILES[email], email })
  })

  // 3. Override with local storage profiles (merging to keep new seed fields)
  if (typeof window !== "undefined") {
    const allProfilesRaw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    if (allProfilesRaw) {
      try {
        const localProfiles = JSON.parse(allProfilesRaw)
        Object.keys(localProfiles).forEach(email => {
          const resolvedEmail = resolveMockEmail(email)
          if (deletedProfiles.has(resolvedEmail)) return
          // If profile exists in seed, merge. If not (new user), just use local.
          if (profilesMap[resolvedEmail]) {
            profilesMap[resolvedEmail] = normalizeModelProfile({ ...profilesMap[resolvedEmail], ...localProfiles[email], email: resolvedEmail })
          } else {
            profilesMap[resolvedEmail] = normalizeModelProfile({ ...localProfiles[email], email: resolvedEmail })
          }
        })
      } catch {
        // ignore error
      }
    }
  }

  return Object.values(profilesMap).map((profile) => normalizeModelProfile(profile))
}

export function getPersistedLocalProfiles(): Array<
  ModelProfile & { email: string }
> {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(MODEL_PROFILE_KEY)
    if (!raw) return []
    const profiles = JSON.parse(raw) as Record<string, ModelProfile>

    return Object.entries(profiles)
      .filter(([, profile]) => profile && typeof profile === "object")
      .map(([email, profile]) =>
        normalizeModelProfile({
          ...profile,
          email: resolveMockEmail(email),
        })
      )
  } catch {
    return []
  }
}

export function exportAllLocalData() {
  if (typeof window === "undefined") return null

  const data = {
    exportDate: new Date().toISOString(),
    version: "1.0",
    storage: {
      users: getUsers(),
      // Export all profiles (Mock + Seed + Local)
      profiles: getAllLocalProfiles(),
      homeContent: getHomeContent(),
      chatMessages: (() => {
        const raw = window.localStorage.getItem("spicy_chat_messages")
        return raw ? JSON.parse(raw) : []
      })(),
      favorites: (() => {
        const raw = window.localStorage.getItem("spicy_favorites")
        return raw ? JSON.parse(raw) : []
      })()
    }
  }

  return data
}
