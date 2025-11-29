import React, { createContext, useContext, useMemo, useState } from "react"
import type { MoveType, StageId } from "./BjjData"
import { bjjData } from "./BjjData"
import { moveVideoMap, toYouTubeEmbedWithParams } from "./TechniqueVideo"

export type Node = {
  id: string
  title: string
  moveId?: string
  videoUrl?: string
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
const buildEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`

const extractYouTubeId = (raw?: string | null) => {
  if (!raw) return null
  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw) && !raw.includes("/")) return raw
  const short = /youtu\.be\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (short?.[1]) return short[1]
  const watch = /[?&]v=([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (watch?.[1]) return watch[1]
  const shorts = /shorts\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (shorts?.[1]) return shorts[1]
  const embed = /embed\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (embed?.[1]) return embed[1]
  return null
}

const buildVideoUrl = (moveId?: string | null) => {
  if (!moveId) return null
  const candidate = moveVideoMap[moveId]
  const embed = toYouTubeEmbedWithParams(candidate)
  if (embed) return embed
  const id = extractYouTubeId(candidate)
  return id ? buildEmbedUrl(id) : null
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
