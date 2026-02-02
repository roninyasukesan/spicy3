const PRIVATE_KEY_STORAGE_PREFIX = "spicy3_e2ee_private_key"
const PUBLIC_KEY_STORAGE_PREFIX = "spicy3_e2ee_public_key"

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function getPrivateKeyStorageKey(userId: string) {
  return `${PRIVATE_KEY_STORAGE_PREFIX}:${userId}`
}

function getPublicKeyStorageKey(userId: string) {
  return `${PUBLIC_KEY_STORAGE_PREFIX}:${userId}`
}

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  )
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const spki = await window.crypto.subtle.exportKey("spki", publicKey)
  return bufferToBase64(spki)
}

export async function importPublicKey(publicKey: string): Promise<CryptoKey> {
  const spki = base64ToArrayBuffer(publicKey)
  return window.crypto.subtle.importKey(
    "spki",
    spki,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  )
}

export async function deriveSharedKey(privateKey: CryptoKey, foreignPublicKey: CryptoKey): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: foreignPublicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptMessage(sharedKey: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded
  )
  return {
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertext)
  }
}

export async function decryptMessage(sharedKey: CryptoKey, iv: string, ciphertext: string): Promise<string> {
  const ivBytes = new Uint8Array(base64ToArrayBuffer(iv))
  const encrypted = base64ToArrayBuffer(ciphertext)
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    sharedKey,
    encrypted
  )
  return new TextDecoder().decode(decrypted)
}

export async function savePrivateKey(userId: string, privateKey: CryptoKey): Promise<void> {
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", privateKey)
  localStorage.setItem(getPrivateKeyStorageKey(userId), bufferToBase64(pkcs8))
}

export async function loadPrivateKey(userId: string): Promise<CryptoKey | null> {
  const raw = localStorage.getItem(getPrivateKeyStorageKey(userId))
  if (!raw) return null
  const pkcs8 = base64ToArrayBuffer(raw)
  return window.crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveKey"]
  )
}

export function getLocalPublicKey(userId: string): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(getPublicKeyStorageKey(userId))
}

export function setLocalPublicKey(userId: string, publicKey: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(getPublicKeyStorageKey(userId), publicKey)
}

export async function getOrCreateKeyPair(userId: string): Promise<{ publicKey: string; privateKey: CryptoKey }> {
  const existingPrivate = await loadPrivateKey(userId)
  const existingPublic = getLocalPublicKey(userId)
  if (existingPrivate && existingPublic) {
    return { publicKey: existingPublic, privateKey: existingPrivate }
  }
  const keyPair = await generateKeyPair()
  const publicKey = await exportPublicKey(keyPair.publicKey)
  await savePrivateKey(userId, keyPair.privateKey)
  setLocalPublicKey(userId, publicKey)
  return { publicKey, privateKey: keyPair.privateKey }
}
