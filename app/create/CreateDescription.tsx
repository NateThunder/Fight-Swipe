import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import * as ImagePicker from "expo-image-picker"
import React, { useEffect, useState } from "react"
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native"

type CreateDescriptionProps = {
  visible: boolean
  onClose: () => void
  onSave: (payload: { title: string; description: string; mediaUri?: string; mediaType?: "image" | "video" }) => void
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
  const [mediaUri, setMediaUri] = useState<string | undefined>(undefined)
  const [mediaType, setMediaType] = useState<"image" | "video" | undefined>(undefined)

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setMediaUri(undefined)
    setMediaType(undefined)
  }, [initialTitle, initialDescription, visible])

  const handleSave = () => {
    const name = title.trim()
    if (!name) return
    onSave({ title: name, description: description.trim(), mediaUri, mediaType })
    setTitle("")
    setDescription("")
    setMediaUri(undefined)
    setMediaType(undefined)
    onClose()
  }

  const handleLaunchCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (!perm.granted) {
        Alert.alert("Permission required", "Camera permission is needed to capture media.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      })
      if (result.canceled) return
      const asset = result.assets?.[0]
      if (!asset?.uri) return
      const type = asset.type === "video" ? "video" : "image"
      setMediaUri(asset.uri)
      setMediaType(type)
    } catch (err) {
      Alert.alert(
        "Camera unavailable",
        "expo-image-picker could not be loaded. Make sure it is installed in this project."
      )
    }
  }

  const handleLaunchLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert("Permission required", "Photos permission is needed to pick media.")
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        allowsMultipleSelection: false,
      })
      if (result.canceled) return
      const asset = result.assets?.[0]
      if (!asset?.uri) return
      const type = asset.type === "video" ? "video" : "image"
      setMediaUri(asset.uri)
      setMediaType(type)
    } catch (err) {
      Alert.alert(
        "Library unavailable",
        "expo-image-picker could not be loaded. Make sure it is installed in this project."
      )
    }
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
          <View style={{ position: "absolute", left: 12, bottom: 12, flexDirection: "row", gap: 8 }}>
            <Pressable onPress={handleLaunchCamera} style={{ padding: 8, borderRadius: 999 }}>
              <MaterialCommunityIcons name="camera-outline" size={26} color="#f97316" />
            </Pressable>
            <Pressable onPress={handleLaunchLibrary} style={{ padding: 8, borderRadius: 999 }}>
              <MaterialCommunityIcons name="image-multiple-outline" size={26} color="#f97316" />
            </Pressable>
          </View>

          <View style={{ gap: 4, alignItems: "center" }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700", textAlign: "center" }}>Add Move</Text>
            <Text style={{ color: "#94a3b8", fontSize: 14, textAlign: "center" }}>
              Name your move and add a description.
            </Text>
          </View>

          {!!mediaUri && (
            <View
              style={{
                width: "100%",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                padding: 10,
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <Text style={{ color: "#cbd5e1", fontSize: 13 }}>
                Attached {mediaType === "video" ? "video" : "image"}
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }} numberOfLines={1}>
                {mediaUri}
              </Text>
            </View>
          )}

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
