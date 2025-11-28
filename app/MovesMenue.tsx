import type { FC } from "react"
import { useMemo } from "react"
import { Modal, Pressable, ScrollView, Text, View } from "react-native"
import type { BJJNode } from "./BjjData"
import { bjjData } from "./BjjData"

type MovesMenueProps = {
  visible: boolean
  onClose: () => void
  onSelectMove: (move: BJJNode) => void
  moves?: BJJNode[]
}

const MovesMenue: FC<MovesMenueProps> = ({ visible, onClose, onSelectMove, moves }) => {
  const list = moves && moves.length > 0 ? moves : bjjData.nodes

  const grouped = useMemo(() => {
    const collection = list.reduce<Record<string, BJJNode[]>>((acc, node) => {
      const key = node.group || "Other"
      acc[key] = acc[key] ?? []
      acc[key].push(node)
      return acc
    }, {})

    return Object.entries(collection)
  }, [list])

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", padding: 12, justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: "#0b0d12",
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 14,
            maxHeight: "80%",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          <View style={{ marginBottom: 12, gap: 4 }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700" }}>Pick your next move</Text>
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
              Tap a technique to branch in that direction.
            </Text>
          </View>

          <ScrollView style={{ maxHeight: "70%" }}>
            {grouped.map(([group, moveList]) => (
              <View key={group} style={{ marginBottom: 12 }}>
                <Text
                  style={{
                    color: "#f59e0b",
                    fontSize: 12,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {group}
                </Text>
                {moveList.map((move) => (
                  <Pressable
                    key={move.id}
                    onPress={() => onSelectMove(move)}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 8,
                      gap: 4,
                    }}
                  >
                    <Text style={{ color: "#e2e8f0", fontSize: 16, fontWeight: "700" }}>{move.name}</Text>
                    <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                      Stage {move.stage} - {move.type}
                    </Text>
                    <Text style={{ color: "#cbd5e1", fontSize: 12 }} numberOfLines={2}>
                      {move.notes_md}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 8,
              alignSelf: "flex-end",
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.25)",
            }}
          >
            <Text style={{ color: "#e2e8f0", fontWeight: "700" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export default MovesMenue

