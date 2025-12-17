import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFlow } from "./FlowStore"
import { HamburgerMenu } from "./components/HamburgerMenu"

export default function Explore() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { setShowLobby } = useFlow()

  const goHome = () => {
    setShowLobby(false)
    router.push("/tabs")
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
      <View style={{ flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 16, gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <HamburgerMenu />
          <View style={{ borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)" }}>
            <BlurView intensity={35} tint="dark" style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
              <Pressable onPress={goHome} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <FontAwesome5 name="arrow-left" size={16} color="#f8fafc" />
                <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Back to Flow</Text>
              </Pressable>
            </BlurView>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: "#f8fafc", fontSize: 26, fontWeight: "800" }}>Explore</Text>
          <Text style={{ color: "#94a3b8", fontSize: 14 }}>Coming soon.</Text>
        </View>

        <View
          style={{
            marginTop: 10,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
            backgroundColor: "rgba(255,255,255,0.03)",
            padding: 16,
            gap: 8,
          }}
        >
          <Text style={{ color: "#e2e8f0", fontWeight: "700", fontSize: 16 }}>Stay tuned</Text>
          <Text style={{ color: "#94a3b8", fontSize: 13, lineHeight: 20 }}>
            Explore content will live here. This is a placeholder for now.
          </Text>
        </View>
      </View>
    </GestureHandlerRootView>
  )
}
