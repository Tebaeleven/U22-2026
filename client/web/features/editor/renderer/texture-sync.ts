interface TextureReloadParams {
  textureExists: boolean
  currentDataUrl?: string
  nextDataUrl?: string
}

export function shouldReloadTexture({
  textureExists,
  currentDataUrl,
  nextDataUrl,
}: TextureReloadParams): boolean {
  if (!nextDataUrl) return false
  if (!textureExists) return true
  return currentDataUrl !== nextDataUrl
}
