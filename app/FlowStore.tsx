import React, { createContext, useContext, useMemo, useState } from "react"
import type { MoveType, StageId } from "./BjjData"
import { bjjData } from "./BjjData"
import type { AVPlaybackSource } from "expo-av"
import { moveVideoMap } from "./TechniqueVideo"

export type Node = {
  id: string
  title: string
  moveId?: string
  videoUrl?: AVPlaybackSource | string
  thumbnail?: AVPlaybackSource | { uri: string }
  group?: string
  type?: MoveType
  stage?: StageId
  notes?: string
  left?: string
  right?: string
  up?: string
  down?: string
}

const ROOT_ID = "root"

const buildVideoUrl = (moveId?: string | null) => {
  if (!moveId) return null
  return moveVideoMap[moveId] ?? null
}

const INITIAL_NODES: Record<string, Node> = {
  [ROOT_ID]: {
    id: ROOT_ID,
    moveId: undefined,
    title: "Start Here",
    videoUrl: undefined,
    group: undefined,
    type: undefined,
    stage: undefined,
    notes: undefined,
  },
}

type FlowContextValue = {
  nodes: Record<string, Node>
  setNodes: React.Dispatch<React.SetStateAction<Record<string, Node>>>
  currentId: string
  setCurrentId: React.Dispatch<React.SetStateAction<string>>
  rootId: string
  showLobby: boolean
  setShowLobby: React.Dispatch<React.SetStateAction<boolean>>
}

const FlowContext = createContext<FlowContextValue | null>(null)

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, Node>>(INITIAL_NODES)
  const [currentId, setCurrentId] = useState(ROOT_ID)
  const [showLobby, setShowLobby] = useState(true)

  const value = useMemo(
    () => ({ nodes, setNodes, currentId, setCurrentId, rootId: ROOT_ID, showLobby, setShowLobby }),
    [nodes, currentId, showLobby],
  )

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>
}

export function useFlow() {
  const ctx = useContext(FlowContext)
  if (!ctx) throw new Error("useFlow must be used inside <FlowProvider>")
  return ctx
}

// Default placeholder so Expo Router does not treat this utility as a missing route component.
export default function FlowStoreRoutePlaceholder() {
  return null
}




