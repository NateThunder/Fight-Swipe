// Lightweight wrapper that prefers @react-native-async-storage/async-storage if available,
// and falls back to an in-memory store for environments where it isn't installed.

type AsyncStorageLike = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
  clear: () => Promise<void>
}

let storage: AsyncStorageLike | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@react-native-async-storage/async-storage")
  storage = mod?.default ?? mod
} catch {
  // no-op, will fall back to memory
}

if (!storage) {
  const mem: Record<string, string> = {}
  // eslint-disable-next-line no-console
  console.log("[storage] Falling back to in-memory store (AsyncStorage native module not found)")
  storage = {
    async getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null
    },
    async setItem(key: string, value: string) {
      mem[key] = value
    },
    async removeItem(key: string) {
      delete mem[key]
    },
    async clear() {
      Object.keys(mem).forEach((k) => delete mem[k])
    },
  }
}

if (storage && storage !== (global as any).__memoStorage) {
  // eslint-disable-next-line no-console
  console.log("[storage] Using native AsyncStorage module")
}

export default storage as AsyncStorageLike
