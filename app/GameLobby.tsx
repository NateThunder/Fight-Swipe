import React, { FC, useMemo, useRef, useState, useCallback } from "react"
import { Animated, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native"
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler"
import {
  Button,
  Card,
  Dialog,
  HelperText,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { GameSave } from "./gameSaves"
import type { BJJNode, StageId } from "./BjjData"

interface GameLobbyProps {
  // Rename these upstream if you want, but it’s not required.
  saves: GameSave[]
  onCreateSave: (name: string) => void
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
  4: "#75430bff",
}

const getStageColor = (stage: StageId | null) =>
  stage && stageOrder.includes(stage) ? stageColors[stage] : null

const GameLobby: FC<GameLobbyProps> = ({
  saves,
  onCreateSave = () => {},
  onOpenSave = () => {},
  onDeleteSave = () => {},
  baseNodeLookup,
  onBack,
}) => {
  const theme = useTheme()
  const { width } = useWindowDimensions()

  const safeSaves = Array.isArray(saves) ? saves : []
  const safeLookup = baseNodeLookup ?? {}

  const columns = 1
  const gap = 14
  const padding = 16

  const cardWidth = useMemo(() => {
    const available = width - padding * 2 - gap * (columns - 1)
    return Math.floor(available / columns)
  }, [width, columns])

  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [newChartName, setNewChartName] = useState("")
  const [nameError, setNameError] = useState("")

  // Optional but nice: close the swipe row before deleting, to avoid stuck-open UI.
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({})

  const buildPreviewStages = (save: GameSave) => {
    const stages = Object.values(save.nodes ?? {})
      .map((node) => (node.moveId ? safeLookup[node.moveId]?.stage ?? null : null))
      .filter((stage): stage is StageId => stage !== null)
      .slice(0, 6)

    return stages.length === 0 ? [null, null, null] : stages
  }

  const openNameDialog = () => {
    setNewChartName("")
    setNameError("")
    setNameDialogOpen(true)
  }

  const closeNameDialog = () => {
    setNameDialogOpen(false)
    setNameError("")
  }

  const submitCreate = () => {
    const trimmed = newChartName.trim()
    if (!trimmed) {
      setNameError("Flow chart name is required.")
      return
    }
    closeNameDialog()
    onCreateSave(trimmed)
  }

  const handleDeleteChart = useCallback(
    (id: string) => {
      swipeableRefs.current[id]?.close()
      delete swipeableRefs.current[id]
      onDeleteSave(id)
    },
    [onDeleteSave]
  )

  const renderDeleteAction = (
    id: string,
    _progress?: Animated.AnimatedInterpolation<number>,
    dragX?: Animated.AnimatedInterpolation<number>,
  ) => {
    const bg = dragX
      ? dragX.interpolate({
          inputRange: [-120, 0],
          outputRange: ["rgba(239,68,68,1)", "rgba(239,68,68,0)"],
          extrapolate: "clamp",
        })
      : "rgba(239,68,68,0)"

    const opacity = dragX
      ? dragX.interpolate({
          inputRange: [-60, -10],
          outputRange: [1, 0],
          extrapolate: "clamp",
        })
      : 0

    return (
      <Animated.View
        style={[
          styles.swipeActionWrapRight,
          {
            backgroundColor: bg,
            opacity,
          },
        ]}
      >
        <Button
          mode="contained"
          buttonColor="rgba(0,0,0,0)"
          textColor="#000"
          onPress={() => handleDeleteChart(id)}
          contentStyle={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}
        >
          <MaterialCommunityIcons name="delete-forever-outline" size={28} color="#000" />
        </Button>
      </Animated.View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              backgroundColor: theme.colors.background,
              padding,
              alignItems: "stretch",
              width: "100%",
              paddingBottom: 0,
            },
          ]}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
        <View style={styles.header}>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              letterSpacing: 1,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Saved Flow Charts
          </Text>

          <Text variant="headlineSmall" style={{ fontWeight: "800", textAlign: "center" }}>
            Choose a Flow Chart
          </Text>

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
            Tip: swipe a card left to delete.
          </Text>
        </View>

          <View style={[styles.grid, { gap }]}>
            {safeSaves.map((save) => {
              const stages = buildPreviewStages(save)
              const updatedLabel = new Date(save.updatedAt).toLocaleString()

              return (
                <View key={save.id} style={{ width: "100%" }}>
                  <Swipeable
                    ref={(ref) => {
                      swipeableRefs.current[save.id] = ref
                    }}
                    renderRightActions={(progress, dragX) => renderDeleteAction(save.id, progress, dragX)}
                    rightThreshold={20}
                    overshootRight={false}
                    onSwipeableOpen={() => handleDeleteChart(save.id)}
                  >
                    <Card
                      mode="outlined"
                      style={[styles.card, { borderColor: theme.colors.outlineVariant }]}
                      onPress={() => onOpenSave(save.id)}
                    >
                      <Card.Content style={{ gap: 12 }}>
                        <View
                          style={[
                            styles.previewRow,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          {stages.map((stage, idx) => {
                            const bg = getStageColor(stage)
                            return (
                              <View
                                key={`${save.id}-${idx}`}
                                style={[
                                  styles.previewNode,
                                  {
                                    backgroundColor: bg ?? theme.colors.surface,
                                    borderColor: bg ?? theme.colors.outlineVariant,
                                    opacity: bg ? 1 : 0.35,
                                  },
                                ]}
                              />
                            )
                          })}
                        </View>

                        <View style={{ gap: 2 }}>
                          <Text variant="titleMedium" numberOfLines={1} style={{ fontWeight: "700" }}>
                            {save.name}
                          </Text>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            Updated {updatedLabel}
                          </Text>
                        </View>

                        <Button mode="contained" onPress={() => onOpenSave(save.id)}>
                          Open
                        </Button>
                      </Card.Content>
                    </Card>
                  </Swipeable>
                </View>
              )
            })}
          </View>
        </ScrollView>

        <View
          style={{
            alignItems: "center",
            paddingTop: 4,
            paddingBottom: 16,
            backgroundColor: theme.colors.background,
          }}
        >
          <IconButton
            icon="plus"
            size={20}
            onPress={openNameDialog}
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 999,
              width: 36,
              height: 36,
              justifyContent: "center",
              alignItems: "center",
            }}
          />
          <Text variant="bodySmall" style={{ fontWeight: "600", marginTop: 2 }}>
            Create New Flow Chart
          </Text>
        </View>
      </View>

      <Portal>
        <Dialog visible={nameDialogOpen} onDismiss={closeNameDialog}>
          <Dialog.Title>Name your flow chart</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Flow chart name"
              mode="outlined"
              value={newChartName}
              onChangeText={(t) => {
                setNewChartName(t)
                if (nameError) setNameError("")
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submitCreate}
            />
            <HelperText type="error" visible={!!nameError}>
              {nameError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeNameDialog}>Cancel</Button>
            <Button mode="contained" onPress={submitCreate}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  grid: {
    flexDirection: "column",
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: -8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  previewNode: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
  },
  swipeActionWrapRight: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 16,
  },
})

export default GameLobby
