import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import React from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { Node } from "../CreateSystem"
import type { Axis } from "../CreateSystem"
import { BranchKey } from "../utils/graph"
import { FlowCard } from "./CreateFlowCard"

type Props = {
  parentId: string
  branchNodes: Node[]
  nodes: Record<string, Node>
  cardWidth: number
  cardHeight: number
  axis: Axis
  playingIds: Record<string, boolean>
  setPlayingIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setNodes: React.Dispatch<React.SetStateAction<Record<string, Node>>>
  setCurrentId: (id: string) => void
  setBranchPickerFor: (id: string | null) => void
  completeMove: () => void
  showBackArrow?: boolean
}

export function BranchPicker({
  parentId,
  branchNodes,
  nodes,
  cardWidth,
  cardHeight,
  axis,
  playingIds,
  setPlayingIds,
  setNodes,
  setCurrentId,
  setBranchPickerFor,
  completeMove,
  showBackArrow = true,
}: Props) {
  if (!branchNodes.length) return null

  return (
    <View style={[styles.container, { width: cardWidth, height: cardHeight }]}>
      <Text style={styles.title}>Choose Branch</Text>
      {branchNodes.map((node) => {
        const pickerCardHeight = (cardHeight - 60) / branchNodes.length
        return (
          <Pressable
            key={node.id}
            onPress={() => {
              setNodes((prev) => {
                const child = prev[node.id]
                if (!child) return prev

                const parent = prev[parentId]
                if (!parent) return prev

                const branchKey: BranchKey = "rightBranches"
                const currentList = parent[branchKey] ? [...parent[branchKey]!] : []
                const filtered = currentList.filter((id) => id !== node.id)
                const nextList = [node.id, ...filtered]

                return {
                  ...prev,
                  [parentId]: {
                    ...parent,
                    right: node.id,
                    [branchKey]: nextList,
                  },
                }
              })

              setCurrentId(node.id)
              setBranchPickerFor(null)
              completeMove()
            }}
          >
            <FlowCard
              node={node}
              cardWidth={cardWidth}
              cardHeight={pickerCardHeight}
              axis={axis}
              playingIds={playingIds}
              setPlayingIds={setPlayingIds}
              isCurrent={false}
              isRoot={false}
            />
          </Pressable>
        )
      })}

      {showBackArrow && (
        <View pointerEvents="none" style={[styles.leftArrow, { top: cardHeight / 2 - 12 }]}>
          <MaterialIcons name="arrow-back-ios" size={24} color="rgba(148,163,184,0.85)" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    justifyContent: "center",
    gap: 12,
    paddingTop: 12,
  },
  title: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  leftArrow: {
    position: "absolute",
    zIndex: 50,
    elevation: 50,
    left: -28,
  },
})
