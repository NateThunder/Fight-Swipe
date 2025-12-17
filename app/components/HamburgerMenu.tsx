import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import Ionicons from "@expo/vector-icons/Ionicons"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { BlurView } from "expo-blur"
import { usePathname, useRouter } from "expo-router"
import React, { useMemo, useRef, useState } from "react"
import { Animated, Modal, Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useFlow } from "../FlowStore"

type HamburgerMenuProps = {
  iconColor?: string
}

/**
 * Small shared hamburger control with quick navigation actions.
 */
export function HamburgerMenu({ iconColor = "#f8fafc" }: HamburgerMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { setShowLobby, showLobby } = useFlow()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const drawerWidth = 280

  type MenuItem = {
    key: string
    label: string
    icon: string
    action: () => void
    family?: "fa5" | "mci" | "ion"
  }

  const isActive = (item: MenuItem) => {
    if (!pathname) return false
    if (item.key === "overview") return pathname.startsWith("/tabs/overview")
    if (item.key === "explore") return pathname.startsWith("/explore")
    if (item.key === "settings") return pathname.startsWith("/settings")
    if (item.key === "lobby") return showLobby && pathname.startsWith("/tabs")
    if (item.key === "flow") {
      const onTabs = pathname.startsWith("/tabs")
      const onOverview = pathname.startsWith("/tabs/overview")
      return onTabs && !onOverview && !showLobby
    }
    return false
  }

  const resetDrawerInstant = () => {
    slideX.setValue(-drawerWidth)
    overlayOpacity.setValue(0)
    setOpen(false)
  }

  const slideX = useRef(new Animated.Value(-drawerWidth)).current
  const overlayOpacity = useRef(new Animated.Value(0)).current

  const animateOpen = () => {
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const animateClose = (onDone?: () => void) => {
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: -drawerWidth,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => onDone?.())
  }

  const items: MenuItem[] = useMemo(
    () => [
      {
        key: "flow",
        label: "Fight Flow",
        icon: "gesture-swipe-horizontal",
        family: "mci",
        action: () => {
          setShowLobby(false)
          router.push("/tabs")
        },
      },
      {
        key: "overview",
        label: "Overview",
        icon: "chart-sankey",
        family: "mci",
        action: () => {
          setShowLobby(false)
          router.push("/tabs/overview")
        },
      },
      {
        key: "settings",
        label: "Settings",
        icon: "settings",
        family: "ion",
        action: () => {
          setShowLobby(false)
          router.push("/settings")
        },
      },
      {
        key: "explore",
        label: "Explore",
        icon: "globe-europe",
        family: "fa5",
        action: () => {
          setShowLobby(false)
          router.push("/explore")
        },
      },
      {
        key: "lobby",
        label: "Lobby",
        icon: "home-variant",
        family: "mci",
        action: () => {
          setShowLobby(true)
          router.push("/tabs")
        },
      },
    ],
    [router, setShowLobby],
  )

  const close = () => animateClose(() => setOpen(false))

  return (
    <View>
      <View style={{ overflow: "hidden", borderRadius: 12 }}>
        <BlurView intensity={35} tint="dark" style={{ padding: 6, borderRadius: 12 }}>
          <Pressable
            onPress={() => {
              setOpen(true)
              requestAnimationFrame(animateOpen)
            }}
            style={{ padding: 6, borderRadius: 999, alignItems: "center", justifyContent: "center" }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <MaterialCommunityIcons name="menu" size={24} color={iconColor} />
          </Pressable>
        </BlurView>
      </View>

      <Modal transparent visible={open} animationType="none" onRequestClose={close}>
        <View style={{ flex: 1 }}>
          <Pressable
            onPress={close}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            accessibilityRole="button"
            accessibilityLabel="Close navigation menu"
          >
            <Animated.View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.55)",
                opacity: overlayOpacity,
              }}
            />
          </Pressable>

          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: drawerWidth,
              backgroundColor: "#0b0d12",
              borderRightWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              paddingTop: insets.top + 18,
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 18,
              transform: [{ translateX: slideX }],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <View style={{ padding: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <MaterialCommunityIcons name="swap-horizontal-bold" size={20} color="#f97316" />
              </View>
              <View>
                <Text style={{ color: "#f8fafc", fontWeight: "800", fontSize: 18 }}>Fight Swipe</Text>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>Flow trainer</Text>
              </View>
            </View>

            {items.map((item) => (
              (() => {
                const active = isActive(item)
                const bg = active ? "rgba(249,115,22,0.14)" : "rgba(255,255,255,0.04)"
                const border = active ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.06)"
                const iconTint = active ? "#f97316" : "#f8fafc"
                const textTint = active ? "#f97316" : "#f8fafc"

                return (
              <Pressable
                key={item.key}
                onPress={() => {
                  resetDrawerInstant()
                  item.action()
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  marginBottom: 8,
                  backgroundColor: bg,
                  borderWidth: 1,
                  borderColor: border,
                }}
              >
                {item.family === "fa5" ? (
                  <FontAwesome5 name={item.icon as any} size={22} color={iconTint} />
                ) : item.family === "ion" ? (
                  <Ionicons name={item.icon as any} size={22} color={iconTint} />
                ) : (
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={iconTint} />
                )}
                <Text style={{ color: textTint, fontWeight: "700", fontSize: 16 }}>{item.label}</Text>
              </Pressable>
                )
              })()
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

export default HamburgerMenu
