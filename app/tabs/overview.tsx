import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  State,
  type PanGestureHandlerGestureEvent,
  type PinchGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";
import { useFlow } from "../FlowStore";
import { HamburgerMenu } from "../components/HamburgerMenu";

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
  const { nodes, setCurrentId, currentId, rootId, setShowLobby } = useFlow()
  const insets = useSafeAreaInsets()

  const camX = useRef(new Animated.Value(0)).current
  const camY = useRef(new Animated.Value(0)).current
  const gX = useRef(new Animated.Value(0)).current
  const gY = useRef(new Animated.Value(0)).current
  const translateX = Animated.add(camX, gX)
  const translateY = Animated.add(camY, gY)
  const baseScale = useRef(new Animated.Value(1)).current
  const pinchScale = useRef(new Animated.Value(1)).current
  const scale = Animated.multiply(baseScale, pinchScale)
  const lastPan = useRef({ x: 0, y: 0 })
  const lastScale = useRef(1)
  const hasInitialized = useRef(false)
  const [isPanning, setIsPanning] = useState(false)

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

  // Initialize centering ONCE on mount, not on every render
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const rootPos = positioned[rootId]
    if (!rootPos) return
    const { width: vw, height: vh } = Dimensions.get("window")
    const extraDown = insets.top - 120
    const centerX = vw / 2 - (rootPos.x + nodeW / 2)
    const centerY = (vh / 2 + extraDown) - (rootPos.y + nodeH / 2)

    lastPan.current = { x: centerX, y: centerY }
    camX.setValue(centerX)
    camY.setValue(centerY)
    gX.setValue(0)
    gY.setValue(0)
  }, [])

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  const onPanGestureEvent = Animated.event<PanGestureHandlerGestureEvent["nativeEvent"]>(
    [{ nativeEvent: { translationX: gX, translationY: gY } }],
    { useNativeDriver: true },
  )

  const onPanStateChange = ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
    if (nativeEvent.state === State.ACTIVE) {
      setIsPanning(true)
    }
    if (
      nativeEvent.state === State.END ||
      nativeEvent.state === State.CANCELLED ||
      nativeEvent.state === State.FAILED
    ) {
      lastPan.current = {
        x: lastPan.current.x + nativeEvent.translationX,
        y: lastPan.current.y + nativeEvent.translationY,
      }
      camX.setValue(lastPan.current.x)
      camY.setValue(lastPan.current.y)
      gX.setValue(0)
      gY.setValue(0)
      setIsPanning(false)
    }
  }

  const onPinchGestureEvent = Animated.event<PinchGestureHandlerGestureEvent["nativeEvent"]>(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true },
  )

  const onPinchStateChange = ({ nativeEvent }: PinchGestureHandlerGestureEvent) => {
    if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED) {
      const next = clamp(lastScale.current * nativeEvent.scale, 0.6, 2.5)
      lastScale.current = next
      baseScale.setValue(next)
      pinchScale.setValue(1)
    }
  }

  // center helper (exposed to the top-right button)
  const centerRoot = useCallback(() => {
    const rootPos = positioned[rootId]
    if (!rootPos) return
    const { width: vw, height: vh } = Dimensions.get("window")
    const extraDown = insets.top - 120
    const targetScreenX = vw / 2
    const targetScreenY = vh / 2 + extraDown
    const centerX = targetScreenX - (rootPos.x + nodeW / 2)
    const centerY = targetScreenY - (rootPos.y + nodeH / 2)

    camX.setValue(centerX)
    camY.setValue(centerY)
    gX.setValue(0)
    gY.setValue(0)
    lastPan.current = { x: centerX, y: centerY }
  }, [positioned, rootId, nodeW, nodeH, insets.top, camX, camY, gX, gY])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 20,
          left: 16,
          right: 16,
          zIndex: 200,
          flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
      }}
    >
      {/* top-left back button */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <HamburgerMenu />
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          <BlurView intensity={35} tint="dark" style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Pressable
              onPress={() => {
                setShowLobby(true)
                router.push("/tabs")
              }}
              style={{ borderRadius: 999 }}
            >
              <Text style={{ color: "#f5f5f5", fontWeight: "600" }}>{"\u2190"} Back to Lobby</Text>
            </Pressable>
          </BlurView>
        </View>
      </View>

      {/* top-right center button */}
      <View style={{ alignSelf: "center", overflow: "hidden", borderRadius: 12 }}>
        <BlurView intensity={35} tint="dark" style={{ padding: 6, borderRadius: 12 }}>
          <Pressable onPress={centerRoot} style={{ padding: 4, borderRadius: 999 }}>
              <MaterialCommunityIcons name="image-filter-center-focus-weak" size={20} color="#f8fafc" />
            </Pressable>
          </BlurView>
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 80,
          left: 16,
          right: 16,
          zIndex: 200,
          gap: 8,
        }}
      >
        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            alignSelf: "center",
          }}
        >
          <BlurView intensity={35} tint="dark" style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "800", textAlign: "center" }}>Overview</Text>
          </BlurView>
        </View>

        <View
          style={{
            borderRadius: 16,
            overflow: "hidden",
            alignSelf: "center",
          }}
        >
          <BlurView intensity={35} tint="dark" style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>Tap a node to jump back into the flow.</Text>
          </BlurView>
        </View>
      </View>

      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchStateChange}
      >
        <Animated.View style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanStateChange}
            minDist={8}
            minPointers={1}
            maxPointers={2}
          >
            <Animated.View style={{ flex: 1 }}>
              <Animated.View
                style={{
                  transform: [{ translateX }, { translateY }, { scale }],
                }}
              >
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
                          if (isPanning) return
                          setCurrentId(id)
                          setShowLobby(false)
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
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  )
}
