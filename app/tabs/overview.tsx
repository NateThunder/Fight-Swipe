import { useMemo, useRef } from "react"
import { Animated, Pressable, Text, View } from "react-native"
import { useRouter } from "expo-router"
import Svg, { Line } from "react-native-svg"
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler"
import { useFlow } from "../FlowStore"

type Dir = "left" | "right" | "up" | "down"
const DIRS: Dir[] = ["left", "right", "up", "down"]

const dirDelta: Record<Dir, { dx: number; dy: number }> = {
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
}

function buildEdges(nodes: Record<string, any>) {
  const edges: Array<{ from: string; to: string }> = []
  for (const fromId of Object.keys(nodes)) {
    const n = nodes[fromId]
    for (const d of DIRS) {
      const toId = n?.[d]
      if (toId && nodes[toId]) edges.push({ from: fromId, to: toId })
    }
  }
  return edges
}

function computeGrid(nodes: Record<string, any>, rootId: string) {
  const grid = new Map<string, { gx: number; gy: number }>()
  const used = new Set<string>()
  const q: string[] = []

  const key = (gx: number, gy: number) => `${gx},${gy}`

  grid.set(rootId, { gx: 0, gy: 0 })
  used.add(key(0, 0))
  q.push(rootId)

  while (q.length) {
    const id = q.shift()!
    const pos = grid.get(id)!
    const node = nodes[id]
    if (!node) continue

    for (const d of DIRS) {
      const nextId = node[d]
      if (!nextId || !nodes[nextId] || grid.has(nextId)) continue

      const { dx, dy } = dirDelta[d]
      let gx = pos.gx + dx
      let gy = pos.gy + dy

      if (used.has(key(gx, gy))) {
        const nudges = [
          { ox: 1, oy: 0 },
          { ox: -1, oy: 0 },
          { ox: 0, oy: 1 },
          { ox: 0, oy: -1 },
          { ox: 1, oy: 1 },
          { ox: -1, oy: 1 },
          { ox: 1, oy: -1 },
          { ox: -1, oy: -1 },
        ]
        for (const n of nudges) {
          const nx = gx + n.ox
          const ny = gy + n.oy
          if (!used.has(key(nx, ny))) {
            gx = nx
            gy = ny
            break
          }
        }
      }

      grid.set(nextId, { gx, gy })
      used.add(key(gx, gy))
      q.push(nextId)
    }
  }

  let spill = 0
  for (const id of Object.keys(nodes)) {
    if (grid.has(id)) continue
    grid.set(id, { gx: 4 + spill, gy: 0 })
    spill += 1
  }

  return grid
}

export default function Overview() {
  const router = useRouter()
  const { nodes, setCurrentId, currentId, rootId } = useFlow()

  const panX = useRef(new Animated.Value(0)).current
  const panY = useRef(new Animated.Value(0)).current

  const { positioned, edges, canvasW, canvasH, nodeW, nodeH } = useMemo(() => {
    const nodeW = 150
    const nodeH = 92
    const gapX = 90
    const gapY = 90
    const pad = 80

    const grid = computeGrid(nodes, rootId)

    let minGX = Infinity,
      maxGX = -Infinity,
      minGY = Infinity,
      maxGY = -Infinity

    for (const { gx, gy } of grid.values()) {
      minGX = Math.min(minGX, gx)
      maxGX = Math.max(maxGX, gx)
      minGY = Math.min(minGY, gy)
      maxGY = Math.max(maxGY, gy)
    }

    const stepX = nodeW + gapX
    const stepY = nodeH + gapY

    const positioned: Record<string, { x: number; y: number }> = {}
    for (const [id, { gx, gy }] of grid.entries()) {
      positioned[id] = {
        x: pad + (gx - minGX) * stepX,
        y: pad + (gy - minGY) * stepY,
      }
    }

    const canvasW = pad * 2 + (maxGX - minGX + 1) * stepX
    const canvasH = pad * 2 + (maxGY - minGY + 1) * stepY
    const edges = buildEdges(nodes)

    return { positioned, edges, canvasW, canvasH, nodeW, nodeH }
  }, [nodes, rootId])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800" }}>Overview</Text>
        <Text style={{ color: "#94a3b8", marginTop: 6 }}>Tap a node to jump back into the flow.</Text>
      </View>

      <PanGestureHandler
        onGestureEvent={({ nativeEvent }) => {
          panX.setValue(nativeEvent.translationX)
          panY.setValue(nativeEvent.translationY)
        }}
        onEnded={() => {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true }).start()
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start()
        }}
      >
        <Animated.View style={{ flex: 1, transform: [{ translateX: panX }, { translateY: panY }] }}>
          <View style={{ width: canvasW, height: canvasH }}>
            <Svg width={canvasW} height={canvasH} style={{ position: "absolute", left: 0, top: 0 }}>
              {edges.map((e, idx) => {
                const a = positioned[e.from]
                const b = positioned[e.to]
                if (!a || !b) return null
                const x1 = a.x + nodeW / 2
                const y1 = a.y + nodeH / 2
                const x2 = b.x + nodeW / 2
                const y2 = b.y + nodeH / 2
                return (
                  <Line
                    key={`${e.from}-${e.to}-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(248,250,252,0.35)"
                    strokeWidth={3}
                  />
                )
              })}
            </Svg>

            {Object.keys(positioned).map((id) => {
              const p = positioned[id]
              const n = nodes[id]
              if (!n) return null

              const isCurrent = id === currentId
              const isTerminal = n.type === "Submission" || n.stage === 4

              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setCurrentId(id)
                    router.push("/tabs")
                  }}
                  style={{
                    position: "absolute",
                    left: p.x,
                    top: p.y,
                    width: nodeW,
                    height: nodeH,
                    borderRadius: 16,
                    padding: 10,
                    justifyContent: "center",
                    backgroundColor: "#111827",
                    borderWidth: 2,
                    borderColor: isCurrent ? "#f97316" : "rgba(255,255,255,0.12)",
                    opacity: isTerminal ? 0.9 : 1,
                  }}
                >
                  <Text style={{ color: "#f8fafc", fontWeight: "800" }} numberOfLines={2}>
                    {n.title}
                  </Text>
                  <Text style={{ color: "#94a3b8", marginTop: 6, fontSize: 12 }} numberOfLines={1}>
                    {n.type ?? "Unknown"} {n.stage ? `• Stage ${n.stage}` : ""}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  )
}
