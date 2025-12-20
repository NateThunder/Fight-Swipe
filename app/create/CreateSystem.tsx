
import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { BlurView } from "expo-blur"
import { useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Animated, Dimensions, Easing, Pressable, Text, View } from "react-native"
import {
    GestureHandlerRootView,
    PanGestureHandler,
    type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { BJJNode } from "../BjjData"
import { bjjData } from "../BjjData"
import { HamburgerMenu } from "../components/HamburgerMenu"
import { useFlow, type Node } from "../FlowStore"
import GameLobby from "../GameLobby"
import {
    BranchKey,
    branchListKey,
    Direction,
    getBranchList,
    neighborKey,
    opposite,
} from "../tabs/utils/graph"
import { BranchPicker } from "./CreateBranchPicker"
import CreateDescription from "./CreateDescription"
import { FlowCard } from "./CreateFlowCard"
import {
    createGameSave,
    loadAutoSave,
    loadGameSaves,
    persistAutoSave,
    persistGameSaves,
    updateGameSaveNodes,
    type GameSave,
} from "./CreateSystemGameSave"

export type Axis = "x" | "y"

type UserMoveInput = {
  title: string
  description: string
  mediaUri?: string
  mediaType?: "image" | "video"
}

export default function Index() {
  const { nodes, setNodes, currentId, setCurrentId, showLobby, setShowLobby, rootId } = useFlow()
  const params = useLocalSearchParams()
  const [playingIds, setPlayingIds] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<GameSave[]>([])
  const [activeSaveId, setActiveSaveId] = useState<string | null>(null)
  const insets = useSafeAreaInsets()
  const [ready, setReady] = useState(false)
  const lastSyncedRef = useRef<string | null>(null)

  const nodesHistoryRef = useRef<Array<{ nodes: Record<string, Node>; currentId: string }>>([])
  const isUndoRef = useRef(false)
  const initialActiveSaveFromParams = useRef(false)

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
    nodesHistoryRef.current = [{ nodes: { [rootId]: blank }, currentId: rootId }]
    setReady(true)
  }, [rootId, setNodes, setCurrentId])

  const [menuVisible, setMenuVisible] = useState(false)
  const [menuDirection, setMenuDirection] = useState<null | "right" | "down">(null)
  const [menuParentId, setMenuParentId] = useState<string | null>(null)
  const [branchPickerFor, setBranchPickerFor] = useState<string | null>(null)

  const initialOffsets = useMemo(() => ({ x: 0, y: 0 }), [])
  const translateX = useRef(new Animated.Value(initialOffsets.x)).current
  const translateY = useRef(new Animated.Value(initialOffsets.y)).current
  const baseYOffset = useRef(new Animated.Value(20)).current

  const [axis, setAxis] = useState<Axis>("x")
  const lockedAxis = useRef<Axis | null>(null)

  const { width: screenWidth } = Dimensions.get("window")

  const horizontalGap = 32
  const verticalGap = 32

  const cardWidth = screenWidth - 80
  const cardHeight = Math.max(cardWidth * (16 / 9), 320)

  const distanceX = cardWidth + horizontalGap
  const distanceY = cardHeight + verticalGap

  const baseNodeLookup = useMemo(() => {
    return bjjData.nodes.reduce<Record<string, BJJNode>>((acc, node) => {
      acc[node.id] = node
      return acc
    }, {})
  }, [])

  const getNeighborId = useCallback(
    (dir: Direction) => {
      const ids = getBranchList(nodes[currentId], dir).filter((id) => Boolean(nodes[id]))
      return ids[0]
    },
    [currentId, nodes],
  )

  const hasLeft = !!getNeighborId("left")
  const hasRight = !!getNeighborId("right")
  const hasUp = !!getNeighborId("up")
  const hasDown = !!getNeighborId("down")

  const currentNode = nodes[currentId]
  const isTerminal = currentNode?.type === "Submission" || currentNode?.stage === 4
  const isRootBlank = useMemo(() => {
    const rootNode = nodes[rootId]
    if (!rootNode) return true
    const onlyRoot = Object.keys(nodes).length === 1 && currentId === rootId
    if (!onlyRoot) return false
    const hasContent =
      (!!rootNode.title && rootNode.title.trim() !== "" && rootNode.title !== "Start Here") ||
      !!rootNode.notes ||
      !!rootNode.videoUrl
    return !hasContent
  }, [nodes, rootId, currentId])

  const rightBranchRootNode = useMemo(() => {
    if (!branchPickerFor) return undefined
    return nodes[branchPickerFor]
  }, [branchPickerFor, nodes])

  const rightBranchNodes = useMemo(
    () =>
      rightBranchRootNode
        ? getBranchList(rightBranchRootNode, "right")
            .map((id) => nodes[id])
            .filter((n): n is Node => Boolean(n))
        : [],
    [rightBranchRootNode, nodes],
  )

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
    [completeMove, distanceX, distanceY, timing, translateX, translateY, setCurrentId],
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

      if (branchPickerFor && dir === "left") {
        const parentId = branchPickerFor
        springToZero(translateX)
        springToZero(translateY)
        lockedAxis.current = null
        setCurrentId(parentId)
        setBranchPickerFor(null)
        completeMove()
        return
      }

      if (!branchPickerFor && dir === "right" && currentNode) {
        const branchIds = getBranchList(currentNode, "right")
        if (branchIds.length > 1) {
          springToZero(translateX)
          springToZero(translateY)
          lockedAxis.current = null
          setBranchPickerFor(currentId)
          return
        }

        if (branchPickerFor) {
          setBranchPickerFor(null)
        }
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
    [
      animateToNeighbor,
      dirFromGestureEnd,
      getNeighborId,
      springToZero,
      translateX,
      translateY,
      branchPickerFor,
      currentNode,
      currentId,
      setCurrentId,
      setBranchPickerFor,
      completeMove,
    ],
  )

  const handleGoToRoot = useCallback(() => {
    setCurrentId(rootId)
    completeMove()
  }, [rootId, setCurrentId, completeMove])

  const handleDelete = useCallback(
    (nodeId: string) => {
      if (nodeId === rootId) return

      const branchToDir: Record<BranchKey, Direction> = {
        leftBranches: "left",
        rightBranches: "right",
        upBranches: "up",
        downBranches: "down",
      }

      const targetSnapshot = nodes[nodeId]
      const parentCandidate: string | null =
        (targetSnapshot?.left as string | undefined) ??
        (targetSnapshot?.up as string | undefined) ??
        null

      let removed = new Set<string>()
      let nextFocus: string | null = null

      setNodes((prev) => {
        const target = prev[nodeId]
        if (!target) return prev

        const toRemove = new Set<string>()
        const stack: string[] = [nodeId]

        while (stack.length) {
          const id = stack.pop()!
          if (toRemove.has(id)) continue
          toRemove.add(id)

          const node = prev[id]
          if (!node) continue

          ;(["left", "right", "up", "down"] as Direction[]).forEach((dir) => {
            const ref = node[dir] as string | undefined
            if (ref && ref !== parentCandidate && !toRemove.has(ref)) {
              stack.push(ref)
            }
          })

          ;(["leftBranches", "rightBranches", "upBranches", "downBranches"] as BranchKey[]).forEach((bk) => {
            const list = node[bk]
            if (!list) return
            list.forEach((childId) => {
              if (childId !== parentCandidate && !toRemove.has(childId)) {
                stack.push(childId)
              }
            })
          })
        }

        removed = toRemove

        const newNodes: Record<string, Node> = { ...prev }
        toRemove.forEach((id) => delete newNodes[id])

        for (const [id, node] of Object.entries(newNodes)) {
          let updated = node

          ;(["left", "right", "up", "down"] as Direction[]).forEach((dir) => {
            const ref = updated[dir]
            if (ref && toRemove.has(ref as string)) {
              updated = { ...updated, [dir]: undefined }
              nextFocus = nextFocus ?? id
            }
          })

          ;(["leftBranches", "rightBranches", "upBranches", "downBranches"] as BranchKey[]).forEach((bk) => {
            const list = updated[bk]
            if (list?.some((n) => toRemove.has(n))) {
              const filtered = list.filter((n) => !toRemove.has(n))
              const dir = branchToDir[bk]
              updated = {
                ...updated,
                [bk]: filtered.length ? filtered : undefined,
                [dir]: filtered[0],
              }
              nextFocus = nextFocus ?? id
            }
          })

          if (updated !== node) {
            newNodes[id] = updated
          }
        }

        return newNodes
      })

      setPlayingIds((prev) => {
        const next = { ...prev }
        removed.forEach((id) => delete next[id])
        return next
      })

      setMenuVisible(false)
      setMenuDirection(null)
      setMenuParentId(null)
      setBranchPickerFor(null)

      const focusId = (() => {
        if (parentCandidate && !removed.has(parentCandidate)) return parentCandidate
        if (nextFocus && !removed.has(nextFocus)) return nextFocus
        return rootId
      })()

      setCurrentId(focusId)
      completeMove()
    },
    [completeMove, rootId, setCurrentId, setNodes, nodes],
  )

  const handleUndo = useCallback(() => {
    const history = nodesHistoryRef.current
    if (history.length < 2) {
      return
    }

    history.pop()
    const prev = history[history.length - 1]
    if (!prev) return

    isUndoRef.current = true
    setNodes(prev.nodes)
    setCurrentId(prev.currentId)
  }, [setNodes, setCurrentId])

  const stageTransform = [{ translateX }, { translateY: Animated.add(translateY, baseYOffset) }]

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

  const rootHasFlow = useMemo(() => {
    const rootNode = nodes[rootId]
    if (!rootNode) return false
    const hasContent =
      (!!rootNode.title && rootNode.title !== "Start Here") || !!rootNode.notes || !!rootNode.videoUrl
    if (hasContent) return true
    return Object.keys(nodes).length > 1
  }, [nodes, rootId])

  const openMoveMenu = (dir?: "right" | "down") => {
    if (isTerminal) return
    setMenuDirection(dir ?? null)
    setMenuParentId(currentId)
    setMenuVisible(true)
  }

  const handleDescriptionSave = (input: UserMoveInput) => {
    if (!menuParentId) return
    const cleanTitle = input.title.trim()
    const cleanNotes = input.description.trim()
    if (!cleanTitle) return

    if (!menuDirection) {
      setNodes((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([id, node]) =>
            id === menuParentId
              ? [
                  id,
                  {
                    ...node,
                    title: cleanTitle,
                    notes: cleanNotes || undefined,
                    moveId: node.moveId,
                    videoUrl: input.mediaType === "video" ? input.mediaUri ?? node.videoUrl : node.videoUrl,
                    thumbnail: input.mediaType === "image" ? (input.mediaUri ? { uri: input.mediaUri } : node.thumbnail) : node.thumbnail,
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

    attachUserMoveToDirection(input, menuDirection, menuParentId)

    setMenuVisible(false)
    setMenuDirection(null)
    setMenuParentId(null)
  }

  const attachUserMoveToDirection = useCallback(
    (input: UserMoveInput, dir: "right" | "down", parentId: string) => {
      const newId = `node-${Date.now()}`
      const forwardKey = neighborKey(dir)
      const backKey = neighborKey(opposite(dir))
      const branchKey = branchListKey(dir)
      const cleanTitle = input.title.trim()
      const cleanNotes = input.description.trim()
      if (!cleanTitle) return

      setNodes((prev) => {
        const parent = prev[parentId]
        if (!parent) return prev
        const branchList = parent[branchKey] ? [...parent[branchKey]!] : []
        const existingForward = parent[forwardKey] as string | undefined
        if (existingForward && !branchList.includes(existingForward)) branchList.unshift(existingForward)
        branchList.push(newId)

        return {
          ...prev,
          [parentId]: { ...parent, [forwardKey]: branchList[0], [branchKey]: branchList },
          [newId]: {
            id: newId,
            title: cleanTitle,
            moveId: undefined,
            videoUrl: input.mediaType === "video" ? input.mediaUri : undefined,
            thumbnail: input.mediaType === "image" && input.mediaUri ? { uri: input.mediaUri } : undefined,
            group: undefined,
            type: undefined,
            stage: undefined,
            notes: cleanNotes || undefined,
            [backKey]: parentId,
          },
        }
      })

      setCurrentId(newId)
    },
    [setNodes, setCurrentId],
  )

  const loadSavesFromStorage = useCallback(async () => {
    const loaded = await loadGameSaves()
    setSaves(loaded)
  }, [])

  useEffect(() => {
    if (initialActiveSaveFromParams.current) return
    const raw = params?.activeSaveId
    const incomingId = Array.isArray(raw) ? raw[0] : raw
    if (incomingId && typeof incomingId === "string") {
      setActiveSaveId(incomingId)
      setShowLobby(false)
      initialActiveSaveFromParams.current = true
    }
  }, [params, setShowLobby])

  useEffect(() => {
    loadSavesFromStorage()
  }, [loadSavesFromStorage])

  useEffect(() => {
    if (isUndoRef.current) {
      isUndoRef.current = false
      return
    }

    const snapNodes = JSON.parse(JSON.stringify(nodes)) as Record<string, Node>

    nodesHistoryRef.current = [
      ...nodesHistoryRef.current,
      { nodes: snapNodes, currentId },
    ].slice(-30)
  }, [nodes, currentId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const snapshot = await loadAutoSave()
      if (cancelled || !snapshot) return
      setNodes(snapshot.nodes)
      setCurrentId(snapshot.currentId || rootId)
      setShowLobby(false)
      nodesHistoryRef.current = [{ nodes: snapshot.nodes, currentId: snapshot.currentId || rootId }]
      setReady(true)
    }
    load().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [rootId, setNodes, setCurrentId, setShowLobby])

  const handleCreateSave = useCallback(
    async (name: string) => {
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
      nodesHistoryRef.current = [{ nodes: target.nodes, currentId: target.currentId || rootId }]
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

  useEffect(() => {
    const timer = setTimeout(() => {
      persistAutoSave({ nodes, currentId, updatedAt: Date.now() }).catch(() => {})
    }, 500)
    return () => clearTimeout(timer)
  }, [nodes, currentId])

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

  useLayoutEffect(() => {
    if (!ready && nodes[currentId]) {
      setReady(true)
    }
  }, [ready, nodes, currentId])

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

  const canDeleteCurrent =
    !branchPickerFor &&
    ((currentId !== rootId) || (currentId === rootId && rootHasFlow))

  return !ready ? null : (
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <HamburgerMenu />
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
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ overflow: "hidden", borderRadius: 12 }}>
              <BlurView intensity={35} tint="dark" style={{ padding: 6, borderRadius: 12 }}>
                <Pressable onPress={handleUndo} style={{ padding: 4, borderRadius: 999 }}>
                  <FontAwesome5 name="undo-alt" size={20} color="#f5f5f5" />
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

            <View style={{ overflow: "hidden", borderRadius: 12 }}>
              <BlurView intensity={35} tint="dark" style={{ padding: 6, borderRadius: 12 }}>
                <Pressable
                  onPress={() => {
                    setMenuDirection(null)
                    setMenuParentId(currentId)
                    setMenuVisible(true)
                  }}
                  style={{ padding: 4, borderRadius: 999 }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={20} color="#f8fafc" />
                </Pressable>
              </BlurView>
            </View>
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
                    borderWidth: 2,
                    padding: 12,
                    overflow: "visible",
                    transform: stageTransform,
                  }}
                >
                  <View style={{ width: cardWidth, height: cardHeight, position: "relative" }}>
                    {isRootBlank && (
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
                        <Text
                          style={{
                            color: "rgba(249,115,22,0.9)",
                            fontSize: 12,
                            textAlign: "center",
                            paddingHorizontal: 12,
                          }}
                        >
                          Create your first move.
                        </Text>
                      </Pressable>
                    )}

                    {branchPickerFor && rightBranchRootNode && rightBranchNodes.length > 1 ? (
                      <BranchPicker
                        parentId={branchPickerFor}
                        branchNodes={rightBranchNodes}
                        nodes={nodes}
                        cardWidth={cardWidth}
                        cardHeight={cardHeight}
                        axis={axis}
                        playingIds={playingIds}
                        setPlayingIds={setPlayingIds}
                        setNodes={setNodes}
                        setCurrentId={setCurrentId}
                        setBranchPickerFor={setBranchPickerFor}
                        completeMove={completeMove}
                        showBackArrow={Boolean(branchPickerFor)}
                      />
                    ) : (
                      <>
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
                              }}
                            >
                              <FlowCard
                                node={node}
                                cardWidth={cardWidth}
                                cardHeight={cardHeight}
                                axis={axis}
                                playingIds={playingIds}
                                setPlayingIds={setPlayingIds}
                              />
                            </View>
                          )
                        })}
                      </>
                    )}
                  </View>

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
                    {hasRight && !branchPickerFor ? (
                      <View pointerEvents="none">
                        <MaterialIcons name="arrow-forward-ios" size={24} color="rgba(148,163,184,0.85)" />
                      </View>
                    ) : (
                      <View />
                    )}

                    {branchPickerFor || isTerminal || isRootBlank ? (
                      <View pointerEvents="none" style={{ width: 34, height: 34, marginTop: 6 }} />
                    ) : (
                      <Pressable
                        onPress={() => openMoveMenu("right")}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 6,
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

                  {hasLeft && !branchPickerFor && (
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
                      left: outerWidth / 2 - 16,
                      bottom: 0,
                      width: 32,
                      height: 32,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {branchPickerFor ? (
                      <View pointerEvents="none" style={{ width: 32, height: 32 }} />
                    ) : hasDown ? (
                      <View pointerEvents="none">
                        <MaterialIcons name="arrow-downward" size={24} color="rgba(148,163,184,0.85)" />
                      </View>
                    ) : isTerminal ? (
                      <View pointerEvents="none" style={{ width: 32, height: 32 }} />
                    ) : isRootBlank ? (
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

                  {hasUp && !branchPickerFor && (
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

                  <View
                    style={{
                      position: "absolute",
                      zIndex: 60,
                      elevation: 60,
                      right: 60,
                      bottom: -2,
                      width: 36,
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {canDeleteCurrent ? (
                      <Pressable
                        onPress={() =>
                          currentId === rootId ? resetToBlankFlow() : handleDelete(currentId)
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        hitSlop={10}
                      >
                        <MaterialCommunityIcons
                          name="delete-forever-outline"
                          size={20}
                          color="#ef4444"
                        />
                      </Pressable>
                    ) : (
                      <View pointerEvents="none" style={{ width: 36, height: 36 }} />
                    )}
                  </View>
                </Animated.View>
              </View>
            </View>

            <CreateDescription
              visible={menuVisible}
              onClose={() => {
                setMenuVisible(false)
                setMenuDirection(null)
                setMenuParentId(null)
              }}
              onSave={handleDescriptionSave}
              initialTitle={
                menuDirection
                  ? ""
                  : menuParentId
                    ? (() => {
                        const t = nodes[menuParentId]?.title ?? ""
                        return t === "Start Here" ? "" : t
                      })()
                    : ""
              }
              initialDescription={menuDirection ? "" : menuParentId ? nodes[menuParentId]?.notes ?? "" : ""}
            />
          </View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  )
}
