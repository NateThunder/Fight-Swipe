import AsyncStorage from "./asyncStorage"
import type { Node } from "./FlowStore"

export type GameSave = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  nodes: Record<string, Node>
  currentId: string
}

const STORAGE_KEY = "pocketDojo.gameSaves"
const AUTOSAVE_KEY = "pocketDojo.autosave"

export type AutoSaveSnapshot = {
  nodes: Record<string, Node>
  currentId: string
  updatedAt: number
}

const cloneNodes = (nodes: Record<string, Node>): Record<string, Node> =>
  Object.fromEntries(
    Object.entries(nodes).map(([id, node]) => [
      id,
      {
        ...node,
      },
    ]),
  )

export const loadGameSaves = async (): Promise<GameSave[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GameSave[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const persistGameSaves = async (saves: GameSave[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
  } catch (e) {
    // Surface errors so we know when persistence fails.
    // eslint-disable-next-line no-console
    console.error("persistGameSaves failed:", e)
  }
}

export const loadAutoSave = async (): Promise<AutoSaveSnapshot | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTOSAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AutoSaveSnapshot
    if (!parsed?.nodes || !parsed?.currentId) return null
    return parsed
  } catch {
    return null
  }
}

export const persistAutoSave = async (snapshot: AutoSaveSnapshot) => {
  try {
    await AsyncStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore write failures
  }
}

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `save-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

export const createGameSave = (name: string, nodes: Record<string, Node>, currentId: string): GameSave => {
  const timestamp = Date.now()
  return {
    id: generateId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: cloneNodes(nodes),
    currentId,
  }
}

export const updateGameSaveNodes = (save: GameSave, nodes: Record<string, Node>, currentId: string): GameSave => ({
  ...save,
  nodes: cloneNodes(nodes),
  currentId,
  updatedAt: Date.now(),
})
