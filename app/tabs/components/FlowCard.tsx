import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import React from "react"
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native"
import { WebView } from "react-native-webview"
import type { Node } from "../../FlowStore"
import { disableScrollJS, extractYouTubeId } from "../utils/media"

type Axis = "x" | "y"

type Props = {
  node: Node
  cardWidth: number
  cardHeight: number
  axis: Axis
  playingIds: Record<string, boolean>
  setPlayingIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function FlowCard({ node, cardWidth, cardHeight, axis, playingIds, setPlayingIds }: Props) {
  const isEmpty = !node.videoUrl
  const videoId = extractYouTubeId(node.videoUrl)
  const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null
  const isPlaying = Boolean(playingIds[node.id])

  const renderMedia = () => {
    if (isEmpty) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#111827",
          }}
        />
      )
    }

    if (!isPlaying) {
      return (
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
            <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
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
      )
    }

    return (
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
    )
  }

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#f97316",
      }}
    >
      {renderMedia()}

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
}
