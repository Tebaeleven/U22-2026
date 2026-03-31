export type ContactPair = {
  idA: string
  idB: string
}

export function normalizeContactPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}::${idB}` : `${idB}::${idA}`
}

export function parseContactPairKey(key: string): ContactPair {
  const [idA, idB] = key.split("::")
  return { idA, idB }
}

export class FrameContactRegistry {
  private callbackPairs = new Set<string>()
  private fallbackPairs = new Set<string>()

  beginFrame() {
    this.callbackPairs.clear()
    this.fallbackPairs.clear()
  }

  hasPair(idA: string, idB: string) {
    const key = normalizeContactPairKey(idA, idB)
    return this.callbackPairs.has(key) || this.fallbackPairs.has(key)
  }

  recordCallback(idA: string, idB: string) {
    this.callbackPairs.add(normalizeContactPairKey(idA, idB))
  }

  recordFallback(idA: string, idB: string) {
    const key = normalizeContactPairKey(idA, idB)
    if (this.callbackPairs.has(key)) return
    this.fallbackPairs.add(key)
  }

  readPairs(): ContactPair[] {
    return [...this.callbackPairs, ...this.fallbackPairs].map(parseContactPairKey)
  }
}
