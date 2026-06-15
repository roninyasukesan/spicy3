export function isRemoteDataMode() {
  return process.env.NEXT_PUBLIC_REMOTE_DATA_ENABLED === "true"
}

export function isRemoteMediaMode() {
  return process.env.NEXT_PUBLIC_REMOTE_MEDIA_ENABLED === "true"
}
