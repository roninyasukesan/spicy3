import { supabase } from "@/lib/supabase"

export async function uploadProfileImages(userId: string, files: File[]) {
  const bucket = supabase.storage.from("profiles")
  const urls: string[] = []
  for (const file of files) {
    const path = `${userId}/${Date.now()}_${file.name}`
    const { error: upErr } = await bucket.upload(path, file, { upsert: true })
    if (upErr) continue
    const { data } = bucket.getPublicUrl(path)
    if (data?.publicUrl) urls.push(data.publicUrl)
  }
  return urls
}
