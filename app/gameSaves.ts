import type { ActiveNode } from "./useNodeMechanics"

export type GameSave = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  nodes: ActiveNode[]
}

const STORAGE_KEY = "pocketDojo.gameSaves"

const cloneNodes = (nodes: ActiveNode[]): ActiveNode[] =>
  nodes.map((node) => ({
    ...node,
    position: { ...node.position },
  }))

const getSafeWindow = () => {
  if (typeof window === "undefined") return null
  return window
}

export const loadGameSaves = (): GameSave[] => {
  const win = getSafeWindow()
  if (!win) return []
  try {
    const raw = win.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GameSave[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const persistGameSaves = (saves: GameSave[]) => {
  const win = getSafeWindow()
  if (!win) return
  try {
    win.localStorage.setItem(STORAGE_KEY, JSON.stringify(saves))
  } catch {
    // ignore write failures (e.g., storage disabled)
  }
}

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `save-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

export const createGameSave = (name: string, nodes: ActiveNode[]): GameSave => {
  const timestamp = Date.now()
  return {
    id: generateId(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: cloneNodes(nodes),
  }
}

export const updateGameSaveNodes = (save: GameSave, nodes: ActiveNode[]): GameSave => ({
  ...save,
  nodes: cloneNodes(nodes),
  updatedAt: Date.now(),
})
