import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Video, ResizeMode, type AVPlaybackSource } from "expo-av"
import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Animated, Pressable, Text, View, StyleSheet } from "react-native"
import type { Node } from "../../FlowStore"

type Axis = "x" | "y"

type Props = {
  node: Node
  cardWidth: number
  cardHeight: number
  axis: Axis
  playingIds: Record<string, boolean>
  setPlayingIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}

export function FlowCard({ node, cardWidth, cardHeight, playingIds, setPlayingIds }: Props) {
  const isEmpty = !node.videoUrl
  const isPlaying = Boolean(playingIds[node.id])

  const [videoReady, setVideoReady] = useState(false)
  const videoOpacity = useRef(new Animated.Value(0)).current

  // When the video source or node changes, reset play state + fade
  useLayoutEffect(() => {
    setPlayingIds((prev) => {
      if (!prev[node.id]) return prev
      const next = { ...prev }
      delete next[node.id]
      return next
    })

    setVideoReady(false)
    videoOpacity.setValue(0)
  }, [node.id, node.videoUrl, setPlayingIds, videoOpacity])

  // Fade in once the native video reports it's ready
  useEffect(() => {
    if (!videoReady) return
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [videoReady, videoOpacity])

  return (
    <View
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#000",
        borderWidth: 1,
        borderColor: "#f97316",
      }}
    >
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        {isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#111827",
            }}
          />
        ) : (
          <>
            {/* Solid background so there's never a flash of random content */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />

            <Animated.View style={{ flex: 1, opacity: videoOpacity }}>
              <Video
                source={node.videoUrl as AVPlaybackSource}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls={isPlaying}
                shouldPlay={isPlaying}
                isMuted={!isPlaying}
                usePoster={!!node.thumbnail}
                posterSource={node.thumbnail as any}
                posterStyle={{ width: "100%", height: "100%", resizeMode: "cover" }}
                onReadyForDisplay={() => {
                  setVideoReady(true)
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded) return
                  if (status.didJustFinish) {
                    setPlayingIds((prev) => {
                      const next = { ...prev }
                      delete next[node.id]
                      return next
                    })
                  }
                }}
              />
            </Animated.View>

            {/* Play overlay when not playing */}
            {!isPlaying && (
              <Pressable
                onPress={() =>
                  setPlayingIds((prev) => ({
                    ...prev,
                    [node.id]: true,
                  }))
                }
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.25)",
                }}
              >
                <MaterialIcons name="play-circle-fill" size={56} color="#f97316" />
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Text overlay stays the same */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
          backgroundColor: "transparent",
        }}
      >
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700" }} numberOfLines={2}>
          {node.title}
        </Text>
        {!!node.group && (
          <Text style={{ color: "#cbd5e1", fontSize: 14 }}>
            {node.group} {node.stage ? `- Stage ${node.stage}` : ""}
          </Text>
        )}
        {!!node.notes && (
          <Text style={{ color: "#cbd5e1", fontSize: 13 }} numberOfLines={3}>
            {node.notes}
          </Text>
        )}
      </View>
    </View>
  )
}
