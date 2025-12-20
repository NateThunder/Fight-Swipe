import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import React, { useEffect, useState } from "react"
import { Modal, Pressable, Text, TextInput, View } from "react-native"

type CreateDescriptionProps = {
  visible: boolean
  onClose: () => void
  onSave: (payload: { title: string; description: string }) => void
  initialTitle?: string
  initialDescription?: string
}

/**
 * Simple modal to capture a move name and description.
 * Styled similarly to the Moves menu overlay.
 */
export default function CreateDescription({
  visible,
  onClose,
  onSave,
  initialTitle = "",
  initialDescription = "",
}: CreateDescriptionProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
  }, [initialTitle, initialDescription, visible])

  const handleSave = () => {
    const name = title.trim()
    if (!name) return
    onSave({ title: name, description: description.trim() })
    onClose()
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            backgroundColor: "#0b0d12",
            borderRadius: 18,
            paddingVertical: 16,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
            gap: 12,
            width: "100%",
            maxWidth: 420,
            alignItems: "center",
            transform: [{ translateY: -82 }],
            position: "relative",
          }}
        >
          <View style={{ position: "absolute", left: 67, bottom: 20 }}>
            <MaterialCommunityIcons name="camera-outline" size={33} color="#f97316" />
          </View>

          <View style={{ gap: 4, alignItems: "center" }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", textAlign: "center" }}>Add Move</Text>
            <Text style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" }}>
              Name your move and add a description.
            </Text>
          </View>

          <View style={{ gap: 6, width: "100%", alignItems: "center" }}>
            <Text style={{ color: "#cbd5e1", fontSize: 13, textAlign: "center" }}>Move name</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter move name..."
              placeholderTextColor="rgba(148,163,184,0.8)"
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                padding: 12,
                color: "#f8fafc",
                backgroundColor: "rgba(255,255,255,0.04)",
                width: "100%",
                textAlign: "center",
              }}
            />
          </View>

          <View style={{ gap: 6, width: "100%", alignItems: "center" }}>
            <Text style={{ color: "#cbd5e1", fontSize: 13, textAlign: "center" }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add notes or description..."
              placeholderTextColor="rgba(148,163,184,0.8)"
              multiline
              style={{
                minHeight: 90,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                padding: 12,
                color: "#f8fafc",
                backgroundColor: "rgba(255,255,255,0.04)",
                textAlignVertical: "top",
                width: "100%",
                textAlign: "center",
              }}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <Pressable
              onPress={onClose}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.14)",
              }}
            >
              <Text style={{ color: "#e2e8f0", fontWeight: "700" }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(249,115,22,0.6)",
                backgroundColor: "rgba(249,115,22,0.15)",
              }}
            >
              <Text style={{ color: "#f97316", fontWeight: "800" }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
