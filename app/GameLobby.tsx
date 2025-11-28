import React, { FC, useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import type { GameSave } from "./gameSaves"
import type { BJJNode, StageId } from "./BjjData"

interface GameLobbyProps {
  saves: GameSave[]
  onCreateSave: () => void
  onOpenSave: (id: string) => void
  onDeleteSave: (id: string) => void
  baseNodeLookup: Record<string, BJJNode>
  onBack?: () => void
}

const stageOrder: StageId[] = [1, 2, 3, 4]

const stageColors: Record<StageId, string> = {
  1: "#ededed",
  2: "#4f82ff",
  3: "#a855f7",
  4: "#d97706",
}

const getStageColor = (stage: StageId | null) => (stage && stageOrder.includes(stage) ? stageColors[stage] : null)

const GameLobby: FC<GameLobbyProps> = ({
  saves,
  onCreateSave,
  onOpenSave,
  onDeleteSave,
  baseNodeLookup,
  onBack,
}) => {
  const safeSaves = Array.isArray(saves) ? saves : []
  const safeLookup = baseNodeLookup ?? {}

  const buildPreviewStages = (save: GameSave) => {
    const stages = save.nodes
      .map((node) => (node.moveId ? safeLookup[node.moveId]?.stage ?? null : null))
      .filter((stage): stage is StageId => stage !== null)
      .slice(0, 6)

    if (stages.length === 0) {
      return [null, null, null]
    }

    return stages
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>{onBack ? (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>{"\u2190"} Back</Text>
          </Pressable>
        ) : null}</View>
        <Text style={styles.eyebrow}>Saved Flows</Text>
        <Text style={styles.title}>Choose a Training Map</Text>
        <Text style={styles.copy}>Jump back into a flow you were building or spin up a fresh plan for today&apos;s session.</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.cardWrapper}>
          <Pressable style={[styles.card, styles.cardCreate]} onPress={onCreateSave}>
            <View style={[styles.preview, styles.previewCreate]}>
              <Text style={styles.plus}>+</Text>
            </View>
          </Pressable>
          <Text style={styles.cardLabel}>Create New Flow</Text>
          <Text style={styles.cardHint}>Start a fresh roadmap</Text>
        </View>

        {safeSaves.map((save) => {
          const stages = buildPreviewStages(save)
          const updatedLabel = useMemo(() => new Date(save.updatedAt).toLocaleString(), [save.updatedAt])

          return (
            <View style={styles.cardWrapper} key={save.id}>
              <Pressable
                style={styles.deleteButton}
                onPress={(event) => {
                  event.stopPropagation()
                  onDeleteSave(save.id)
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
              <Pressable style={styles.card} onPress={() => onOpenSave(save.id)}>
                <View style={styles.preview}>
                  {stages.map((stage, idx) => {
                    const bg = getStageColor(stage)
                    return (
                      <View
                        key={`${save.id}-${idx}`}
                        style={[
                          styles.previewNode,
                          bg ? { backgroundColor: bg, borderColor: bg } : styles.previewEmpty,
                        ]}
                      />
                    )
                  })}
                </View>
              </Pressable>
              <Text style={styles.cardLabel}>{save.name}</Text>
              <Text style={styles.cardHint}>Updated {updatedLabel}</Text>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: "rgba(11, 11, 11, 0.92)",
  },
  header: {
    gap: 4,
  },
  headerActions: {
    marginBottom: 6,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  backButtonText: {
    color: "#f5f5f5",
    fontWeight: "600",
  },
  eyebrow: {
    color: "#f5f5f5",
    fontSize: 12,
    letterSpacing: 0.12,
    textTransform: "uppercase",
  },
  title: {
    color: "#f5f5f5",
    fontSize: 22,
    fontWeight: "800",
  },
  copy: {
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },
  cardWrapper: {
    width: 220,
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: -22,
    left: "50%",
    transform: [{ translateX: -50 }],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,71,71,0.5)",
    backgroundColor: "rgba(255,56,56,0.08)",
  },
  deleteButtonText: {
    color: "#ff7b7b",
    fontSize: 12,
    letterSpacing: 0.6,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    gap: 12,
  },
  cardCreate: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  previewCreate: {
    justifyContent: "center",
    width: 44,
    height: 22,
  },
  previewNode: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  previewEmpty: {
    opacity: 0.4,
  },
  plus: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 26,
  },
  cardLabel: {
    marginTop: 4,
    fontWeight: "700",
    color: "#f5f5f5",
  },
  cardHint: {
    marginTop: 0,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
})

export default GameLobby
