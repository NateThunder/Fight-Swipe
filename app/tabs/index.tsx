import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { BlurView } from "expo-blur"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  Text,
  View,
} from "react-native"
import {
  GestureHandlerRootView,
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"
import type { BJJNode } from "../BjjData"
import { bjjData } from "../BjjData"
import { useFlow, type Node } from "../FlowStore"
import GameLobby from "../GameLobby"
import {
  createGameSave,
  loadAutoSave,
  loadGameSaves,
  persistAutoSave,
  persistGameSaves,
  updateGameSaveNodes,
  type GameSave,
} from "../gameSaves"
import MovesMenue from "../MovesMenue"
import { moveVideoMap, toYouTubeEmbedWithParams } from "../TechniqueVideo"

type Axis = "x" | "y"
type Direction = "left" | "right" | "up" | "down"

const buildEmbedUrl = (id: string) => `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`

const extractYouTubeId = (raw?: string | null) => {
  if (!raw) return null
  // Accept direct IDs
  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw) && !raw.includes("/")) return raw
  // youtu.be/<id>
  const short = /youtu\.be\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (short?.[1]) return short[1]
  // youtube.com/watch?v=<id>
  const watch = /[?&]v=([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (watch?.[1]) return watch[1]
  // shorts/<id>
  const shorts = /shorts\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (shorts?.[1]) return shorts[1]
  // embed/<id>
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

const disableScrollJS = `
  (function() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  })();
  true;
`

function opposite(dir: Direction): Direction {
  switch (dir) {
    case "left":
      return "right"
    case "right":
      return "left"
    case "up":
      return "down"
    case "down":
      return "up"
  }
}

function neighborKey(dir: Direction): keyof Node {
  switch (dir) {
    case "left":
      return "left"
    case "right":
      return "right"
    case "up":
      return "up"
    case "down":
      return "down"
  }
}

export default function Index() {
  const { nodes, setNodes, currentId, setCurrentId, showLobby, setShowLobby, rootId } = useFlow()
  const [playingIds, setPlayingIds] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<GameSave[]>([])
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const lastSyncedRef = useRef<string | null>(null)

  const resetToBlankFlow = useCallback(() => {
    const blank: Node = {
      id: rootId,
      title: "Start Here",
      moveId: undefined,
      videoUrl: undefined,
      group: undefined,
      type: undefined,
      stage: undefined,
      notes: undefined,
      left: undefined,
      right: undefined,
      up: undefined,
      down: undefined,
    }
    setNodes({ [rootId]: blank })
    setCurrentId(rootId)
    setPlayingIds({})
    lastSyncedRef.current = null
  }, [rootId, setNodes, setCurrentId])

  const [menuVisible, setMenuVisible] = useState(false)
  const [menuDirection, setMenuDirection] = useState<null | "right" | "down">(null)
  const [menuParentId, setMenuParentId] = useState<string | null>(null)

  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  const [axis, setAxis] = useState<Axis>("x")
  const lockedAxis = useRef<Axis | null>(null)

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

  const horizontalGap = 32
  const verticalGap = 32

  const cardWidth = screenWidth - 80
  const cardHeight = Math.max(screenHeight * 0.55, 320)

  const distanceX = cardWidth + horizontalGap
  const distanceY = cardHeight + verticalGap

  const baseNodeLookup = useMemo(() => {
    return bjjData.nodes.reduce<Record<string, BJJNode>>((acc, node) => {
      acc[node.id] = node
      return acc
    }, {})
  }, [])

  const edgeLookup = useMemo(() => {
    return bjjData.edges.reduce<Record<string, string[]>>((acc, edge) => {
      acc[edge.from] = acc[edge.from] ?? []
      acc[edge.from].push(edge.to)
      return acc
    }, {})
  }, [])

  const stageOneMoves = useMemo(() => bjjData.nodes.filter((node) => node.stage === 1), [])

  const getNeighborId = useCallback(
    (dir: Direction) => {
      const k = neighborKey(dir)
      return nodes[currentId]?.[k]
    },
    [currentId, nodes],
  )

  const availableMoves = useMemo(() => {
    if (!menuParentId) return stageOneMoves
    const parentMoveId = nodes[menuParentId]?.moveId
    if (!parentMoveId) return stageOneMoves

    const nextIds = edgeLookup[parentMoveId] ?? []
    const next = nextIds.map((id) => baseNodeLookup[id]).filter((node): node is BJJNode => Boolean(node))
    return next.length > 0 ? next : stageOneMoves
  }, [menuParentId, nodes, edgeLookup, baseNodeLookup, stageOneMoves])

  const hasLeft = !!getNeighborId("left")
  const hasRight = !!getNeighborId("right")
  const hasUp = !!getNeighborId("up")
  const hasDown = !!getNeighborId("down")

  const currentNode = nodes[currentId]
  const isTerminal = currentNode?.type === "Submission" || currentNode?.stage === 4

  const timing = useCallback(
    (val: Animated.Value, toValue: number, onDone?: () => void) => {
      Animated.timing(val, {
        toValue,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone?.()
      })
    },
    [],
  )

  const springToZero = useCallback((val: Animated.Value) => {
    Animated.spring(val, { toValue: 0, useNativeDriver: true }).start()
  }, [])

  const handleGestureEvent = useCallback(
    ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
      const { translationX, translationY } = nativeEvent
      const absX = Math.abs(translationX)
      const absY = Math.abs(translationY)

      const slop = 10
      const dominance = 1.2
      if (!lockedAxis.current && (absX > slop || absY > slop)) {
        if (absX > absY * dominance) lockedAxis.current = "x"
        else if (absY > absX * dominance) lockedAxis.current = "y"
        if (lockedAxis.current) setAxis(lockedAxis.current)
      } else if (!lockedAxis.current) {
        setAxis(absX >= absY ? "x" : "y")
      }

      const locked = lockedAxis.current
      if (locked === "x") {
        translateX.setValue(translationX)
        translateY.setValue(0)
      } else if (locked === "y") {
        translateX.setValue(0)
        translateY.setValue(translationY)
      } else {
        translateX.setValue(translationX)
        translateY.setValue(translationY)
      }
    },
    [translateX, translateY],
  )

  const dirFromGestureEnd = useCallback(
    (translationX: number, translationY: number): Direction | null => {
      const absX = Math.abs(translationX)
      const absY = Math.abs(translationY)
      const activeAxis: Axis = lockedAxis.current ?? (absX >= absY ? "x" : "y")
      setAxis(activeAxis)

      const threshold = 60

      if (activeAxis === "x") {
        if (translationX < -threshold) return "right"
        if (translationX > threshold) return "left"
        return null
      }
      if (translationY < -threshold) return "down"
      if (translationY > threshold) return "up"
      return null
    },
    [],
  )

  const completeMove = useCallback(() => {
    translateX.setValue(0)
    translateY.setValue(0)
    lockedAxis.current = null
  }, [translateX, translateY])

  const animateToNeighbor = useCallback(
    (dir: Direction, neighborId: string) => {
      const primary = dir === "left" || dir === "right" ? translateX : translateY

      const toValue =
        dir === "right"
          ? -distanceX
          : dir === "left"
            ? distanceX
            : dir === "down"
              ? -distanceY
              : distanceY

      timing(primary, toValue, () => {
        setCurrentId(neighborId)
        completeMove()
      })
    },
    [completeMove, distanceX, distanceY, timing, translateX, translateY],
  )

  const handleGestureEnd = useCallback(
    ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
      const { translationX, translationY } = nativeEvent
      const dir = dirFromGestureEnd(translationX, translationY)

      if (lockedAxis.current === "x") springToZero(translateY)
      if (lockedAxis.current === "y") springToZero(translateX)

      if (!dir) {
        springToZero(translateX)
        springToZero(translateY)
        lockedAxis.current = null
        return
      }

      const neighborId = getNeighborId(dir)

      if (!neighborId) {
        springToZero(translateX)
        springToZero(translateY)
        lockedAxis.current = null
        return
      }

      animateToNeighbor(dir, neighborId)
    },
    [animateToNeighbor, dirFromGestureEnd, getNeighborId, springToZero, translateX, translateY],
  )

  const handleGoToRoot = useCallback(() => {
    setCurrentId(rootId)
    completeMove()
  }, [rootId, setCurrentId, completeMove])

  const stageTransform = [{ translateX }, { translateY }]

  const outerWidth = cardWidth + horizontalGap * 2
  const outerHeight = cardHeight + verticalGap * 2

  const visibleCards = useMemo(() => {
    const list: Array<{ id: string; offsetX: number; offsetY: number }> = [
      { id: currentId, offsetX: 0, offsetY: 0 },
    ]

    const leftId = getNeighborId("left")
    const rightId = getNeighborId("right")
    const upId = getNeighborId("up")
    const downId = getNeighborId("down")

    if (leftId) list.push({ id: leftId, offsetX: -distanceX, offsetY: 0 })
    if (rightId) list.push({ id: rightId, offsetX: distanceX, offsetY: 0 })
    if (upId) list.push({ id: upId, offsetX: 0, offsetY: -distanceY })
    if (downId) list.push({ id: downId, offsetX: 0, offsetY: distanceY })

    return list
  }, [currentId, distanceX, distanceY, getNeighborId])

  const openMoveMenu = (dir?: "right" | "down") => {
    if (isTerminal) return
    setMenuDirection(dir ?? null)
    setMenuParentId(currentId)
    setMenuVisible(true)
  }

  const attachMoveToDirection = useCallback(
    (move: BJJNode, dir: "right" | "down", parentId: string) => {
      const newId = `node-${Date.now()}`
      const forwardKey = neighborKey(dir)
      const backKey = neighborKey(opposite(dir))
      const embedUrl = buildVideoUrl(move.id)

      setNodes((prev) => {
        const parent = prev[parentId]
        if (!parent || parent[forwardKey]) return prev
        if (parent.type === "Submission" || parent.stage === 4) return prev

        return {
          ...prev,
          [parentId]: { ...parent, [forwardKey]: newId },
          [newId]: {
            id: newId,
            title: move.name,
            moveId: move.id,
            videoUrl: embedUrl ?? undefined,
            group: move.group,
            type: move.type,
            stage: move.stage,
            notes: move.notes_md,
            [backKey]: parentId,
          },
        }
      })

      setCurrentId(newId)
    },
    [],
  )

  const handleMovePicked = (move: BJJNode) => {
    if (!menuParentId) return

    if (!menuDirection) {
      setNodes((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, node]) =>
            id === menuParentId
              ? [
                  id,
                  {
                    ...node,
                    moveId: move.id,
                    title: move.name,
                    videoUrl: buildVideoUrl(move.id) ?? undefined,
                    group: move.group,
                    type: move.type,
                    stage: move.stage,
                    notes: move.notes_md,
                  },
                ]
              : [id, node],
          ),
        ),
      )
      setPlayingIds((prev) => {
        const next = { ...prev }
        delete next[menuParentId]
        return next
      })
      setMenuVisible(false)
      setMenuDirection(null)
      setMenuParentId(null)
      return
    }

    attachMoveToDirection(move, menuDirection, menuParentId)
    setMenuVisible(false)
    setMenuDirection(null)
    setMenuParentId(null)
  }

  const renderCard = (node: Node) => {
    const isEmpty = !node.videoUrl
    const videoId = extractYouTubeId(node.videoUrl)
    const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
    const isPlaying = Boolean(playingIds[node.id])

    return (
      <View style={{ flex: 1 }}>
        {isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#111827",
            }}
          />
        ) : !isPlaying ? (
          <Pressable
            onPress={() => setPlayingIds((prev) => ({ ...prev, [node.id]: true }))}
            style={{
              flex: 1,
              backgroundColor: "#0f172a",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {thumbnail ? (
              <Image
                source={{ uri: thumbnail }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : null}
            <View
              style={{
                position: "absolute",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                backgroundColor: "rgba(0,0,0,0.55)",
                borderRadius: 999,
              }}
            >
              <MaterialIcons name="play-circle-fill" size={56} color="#f97316" />
            </View>
          </Pressable>
        ) : (
          <WebView
            source={{ uri: node.videoUrl }}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            useWebKit
            originWhitelist={["*"]}
            contentMode="mobile"
            mixedContentMode="always"
            startInLoadingState
            injectedJavaScript={disableScrollJS}
            scrollEnabled={false}
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            renderToHardwareTextureAndroid
            renderError={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#111827",
                  padding: 16,
                }}
              >
                <Text style={{ color: "#e2e8f0", fontSize: 14, textAlign: "center" }}>
                  Video player configuration error. Try another technique or check your connection.
                </Text>
              </View>
            )}
            renderLoading={() => (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#111827",
                }}
              >
                <ActivityIndicator size="large" color="#f97316" />
              </View>
            )}
            style={{ flex: 1 }}
          />
        )}
      </View>
    )
  }

  const loadSavesFromStorage = useCallback(async () => {
    const loaded = await loadGameSaves()
    setSaves(loaded)
  }, [])

  useEffect(() => {
    loadSavesFromStorage()
  }, [loadSavesFromStorage])

  // Load last autosave if present.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const snapshot = await loadAutoSave()
      if (cancelled || !snapshot) return
      setNodes(snapshot.nodes)
      setCurrentId(snapshot.currentId || rootId)
      setShowLobby(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [rootId, setNodes, setCurrentId, setShowLobby])

  const handleCreateSave = useCallback(
    async (name: string) => {
      // Start from a blank flow when creating a new save.
      resetToBlankFlow()
      const blankNodes = {
        [rootId]: {
          id: rootId,
          title: "Start Here",
          moveId: undefined,
          videoUrl: undefined,
          group: undefined,
          type: undefined,
          stage: undefined,
          notes: undefined,
          left: undefined,
          right: undefined,
          up: undefined,
          down: undefined,
        },
      } satisfies Record<string, Node>

      const newSave = createGameSave(name, blankNodes, rootId)
      const next = [...saves, newSave]
      setSaves(next)
      await persistGameSaves(next)
      setActiveSaveId(newSave.id)
      setShowLobby(false)
    },
    [resetToBlankFlow, rootId, saves, setShowLobby],
  )

  const handleOpenSave = useCallback(
    async (id: string) => {
      const target = saves.find((s) => s.id === id)
      if (!target) return
      setNodes(target.nodes)
      setCurrentId(target.currentId || rootId)
      setActiveSaveId(id)
      setShowLobby(false)
    },
    [rootId, saves, setNodes, setCurrentId, setShowLobby],
  )

  const handleDeleteSave = useCallback(
    async (id: string) => {
      const next = saves.filter((s) => s.id !== id)
      setSaves(next)
      await persistGameSaves(next)
      if (activeSaveId === id) {
        setActiveSaveId(null)
        resetToBlankFlow()
      }
    },
    [activeSaveId, resetToBlankFlow, saves],
  )

  // Autosave current flow (debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      persistAutoSave({ nodes, currentId, updatedAt: Date.now() }).catch(() => {})
    }, 500)
    return () => clearTimeout(timer)
  }, [nodes, currentId])

  // If a save is active, sync it when the flow changes.
  useEffect(() => {
    if (!activeSaveId) return
    const sig = JSON.stringify({ nodes, currentId })
    if (lastSyncedRef.current === sig) return
    lastSyncedRef.current = sig

    setSaves((prev) => {
      const target = prev.find((s) => s.id === activeSaveId)
      if (!target) return prev
      const updated = updateGameSaveNodes(target, nodes, currentId)
      const next = prev.map((s) => (s.id === activeSaveId ? updated : s))
      persistGameSaves(next).catch(() => {})
      return next
    })
  }, [activeSaveId, nodes, currentId])

  if (showLobby) {
    return (
      <GameLobby
        saves={saves}
        onCreateSave={handleCreateSave}
        onOpenSave={handleOpenSave}
        onDeleteSave={handleDeleteSave}
        baseNodeLookup={baseNodeLookup}
        onBack={() => setShowLobby(false)}
      />
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#0b0d12" }}>
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top + 20,
            left: 16,
            right: 16,
            zIndex: 300,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
            }}
          >
            <BlurView intensity={35} tint="dark" style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
              <Pressable onPress={() => setShowLobby(true)} style={{ borderRadius: 999 }}>
                <Text style={{ color: "#f5f5f5", fontWeight: "600" }}>{"\u2190"} Back to Lobby</Text>
              </Pressable>
            </BlurView>
          </View>

          <View style={{ overflow: "hidden", borderRadius: 12 }}>
            <BlurView intensity={35} tint="dark" style={{ padding: 6, borderRadius: 12 }}>
              <Pressable onPress={handleGoToRoot} style={{ padding: 4, borderRadius: 999 }}>
                <MaterialCommunityIcons name="image-filter-center-focus-weak" size={20} color="#f8fafc" />
              </Pressable>
            </BlurView>
          </View>
        </View>

        <PanGestureHandler
          activeOffsetX={[-15, 15]}
          activeOffsetY={[-15, 15]}
          onGestureEvent={handleGestureEvent}
          onEnded={handleGestureEnd}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingTop: 0,
                paddingBottom: 16,
              }}
            >
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Animated.View
                style={{
                  width: outerWidth,
                  height: outerHeight,
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 20,
                  borderWidth: 0,
                  padding: 12,
                  overflow: "visible",
                  transform: stageTransform,
                }}
              >
                <View style={{ width: cardWidth, height: cardHeight, position: "relative" }}>
                  {!nodes[currentId]?.moveId && Object.keys(nodes).length === 1 && (
                    <Pressable
                      onPress={() => openMoveMenu()}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cardWidth,
                        height: cardHeight,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderStyle: "dashed",
                        borderColor: "#f97316",
                        backgroundColor: "rgba(249,115,22,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 5,
                      }}
                    >
                      <Text style={{ color: "#f97316", fontWeight: "800", marginBottom: 6 }}>
                        Start Here
                      </Text>
                      <Text style={{ color: "rgba(249,115,22,0.9)", fontSize: 12, textAlign: "center", paddingHorizontal: 12 }}>
                        Pick your first move to open the menu.
                      </Text>
                    </Pressable>
                  )}
                  {visibleCards.map(({ id, offsetX, offsetY }) => {
                    const node = nodes[id]
                    if (!node) return null

                    return (
                      <View
                        key={id}
                        style={{
                          position: "absolute",
                          left: offsetX,
                          top: offsetY,
                          width: cardWidth,
                          height: cardHeight,
                          zIndex: id === currentId ? 2 : 1,
                          borderRadius: 16,
                          overflow: "hidden",
                          backgroundColor: "#111827",
                          borderWidth: 1,
                          borderColor: "#f97316",
                        }}
                      >
                        {renderCard(node)}

                        <View
                          style={{
                            padding: 16,
                            borderTopWidth: 1,
                            borderTopColor: "rgba(249,115,22,0.35)",
                            backgroundColor: "#0f172a",
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: "#f8fafc",
                              fontSize: 20,
                              fontWeight: "700",
                            }}
                            numberOfLines={2}
                          >
                            {node.title}
                          </Text>
                          <Text style={{ color: "#94a3b8", fontSize: 16 }}>
                            Axis: {axis.toUpperCase()} (swipe only where nodes exist)
                          </Text>
                          {!!node.group && (
                            <Text style={{ color: "#cbd5e1", fontSize: 14 }}>
                              {node.group} {node.stage ? `- Stage ${node.stage}` : ""}
                            </Text>
                          )}
                          {!!node.type && (
                            <Text style={{ color: "#cbd5e1", fontSize: 14 }}>
                              Type: {node.type}
                            </Text>
                          )}
                          {!!node.notes && (
                            <Text style={{ color: "#94a3b8", fontSize: 13 }} numberOfLines={3}>
                              {node.notes}
                            </Text>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>

                {hasLeft && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      zIndex: 50,
                      elevation: 50,
                      left: 4,
                      top: outerHeight / 2 - 12,
                    }}
                  >
                    <MaterialIcons name="arrow-back-ios" size={24} color="rgba(148,163,184,0.85)" />
                  </View>
                )}

                <View
                  style={{
                    position: "absolute",
                    zIndex: 60,
                    elevation: 60,
                    right: 4,
                    top: outerHeight / 2 - 18,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {hasRight ? (
                    <View pointerEvents="none">
                      <MaterialIcons name="arrow-forward-ios" size={24} color="rgba(148,163,184,0.85)" />
                    </View>
                  ) : isTerminal ? (
                    <View pointerEvents="none" style={{ width: 34, height: 34 }} />
                  ) : !currentNode?.moveId && Object.keys(nodes).length === 1 ? (
                    <View pointerEvents="none" style={{ width: 34, height: 34 }} />
                  ) : (
                    <Pressable
                      onPress={() => openMoveMenu("right")}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      hitSlop={10}
                    >
                      <MaterialCommunityIcons
                        name="source-branch-plus"
                        size={24}
                        color="rgba(148,163,184,0.9)"
                      />
                    </Pressable>
                  )}
                </View>

                <View
                  style={{
                    position: "absolute",
                    zIndex: 60,
                    elevation: 60,
                    left: outerWidth / 2 - 16,
                    bottom: 0,
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {hasDown ? (
                    <View pointerEvents="none">
                      <MaterialIcons name="arrow-downward" size={24} color="rgba(148,163,184,0.85)" />
                    </View>
                  ) : isTerminal ? (
                    <View pointerEvents="none" style={{ width: 32, height: 32 }} />
                  ) : !currentNode?.moveId && Object.keys(nodes).length === 1 ? (
                    <View pointerEvents="none" style={{ width: 32, height: 32 }} />
                  ) : (
                    <Pressable
                      onPress={() => openMoveMenu("down")}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      hitSlop={10}
                    >
                      <FontAwesome6 name="plus" size={20} color="rgba(148,163,184,0.85)" />
                    </Pressable>
                  )}
                </View>

                {hasUp && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      zIndex: 50,
                      elevation: 50,
                      left: outerWidth / 2 - 12,
                      top: 4,
                    }}
                  >
                    <MaterialIcons name="arrow-upward" size={24} color="rgba(148,163,184,0.85)" />
                  </View>
                )}
              </Animated.View>
            </View>
          </View>

          <MovesMenue
            visible={menuVisible}
            moves={availableMoves}
            onClose={() => {
              setMenuVisible(false)
              setMenuDirection(null)
              setMenuParentId(null)
            }}
            onSelectMove={handleMovePicked}
          />
          </View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  )
}
