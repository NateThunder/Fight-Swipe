import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Video, ResizeMode, type AVPlaybackSource } from "expo-av"
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Animated, Pressable, Text, View, StyleSheet, Image } from "react-native"
import type { Node } from "../../FlowStore"

type Axis = "x" | "y"

type Props = {
  node: Node
  cardWidth: number
  cardHeight: number
  axis: Axis
  playingIds: Record<string, boolean>
  setPlayingIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  isCurrent: boolean
  isRoot: boolean
}

// Normalize video URL to a string for comparison (handles both string and {uri: string} formats)
const getVideoUrlString = (videoUrl?: AVPlaybackSource | string): string | null => {
  if (!videoUrl) return null
  if (typeof videoUrl === "string") return videoUrl
  if (typeof videoUrl === "object" && videoUrl && "uri" in videoUrl) return videoUrl.uri
  return null
}

export function FlowCard({ node, cardWidth, cardHeight, playingIds, setPlayingIds, isCurrent, isRoot }: Props) {
  const hasVideo = !!node.videoUrl
  const hasImage = !!node.thumbnail && !node.videoUrl
  const isEmpty = !hasVideo && !hasImage
  const isPlaying = Boolean(playingIds[node.id])

  const [videoReady, setVideoReady] = useState(false)
  const videoOpacity = useRef(new Animated.Value(0)).current
  
  // Normalize video URL to string for stable comparison
  const videoUrlString = useMemo(() => getVideoUrlString(node.videoUrl), [node.videoUrl])
  
  // Stabilize video source object to prevent unnecessary re-renders
  const videoSource = useMemo(() => {
    if (!node.videoUrl) return undefined
    // If it's already an object, use it; otherwise wrap string in object
    if (typeof node.videoUrl === "object" && node.videoUrl && "uri" in node.videoUrl) {
      return node.videoUrl as AVPlaybackSource
    }
    if (typeof node.videoUrl === "string") {
      return { uri: node.videoUrl } as AVPlaybackSource
    }
    return node.videoUrl as AVPlaybackSource
  }, [videoUrlString])

  // Track previous values to only reset when they actually change
  const prevNodeIdRef = useRef<string | null>(null)
  const prevVideoUrlStringRef = useRef<string | null>(null)
  const shouldAutoPlayAfterResetRef = useRef(false)
  
  useLayoutEffect(() => {
    const isFirstRender = prevNodeIdRef.current === null
    const nodeIdChanged = prevNodeIdRef.current !== node.id
    const videoUrlChanged = prevVideoUrlStringRef.current !== videoUrlString
    
    // Only reset if node ID or video URL actually changed (not on first render, not on same values)
    if (!isFirstRender && (nodeIdChanged || videoUrlChanged)) {
      // Remember if we should auto-play after reset (current card)
      shouldAutoPlayAfterResetRef.current = isCurrent && hasVideo
      
      setPlayingIds((prev) => {
        if (!prev[node.id]) return prev
        const next = { ...prev }
        delete next[node.id]
        return next
      })

      setVideoReady(false)
      videoOpacity.setValue(0)
    }
    
    // Update refs after checking
    prevNodeIdRef.current = node.id
    prevVideoUrlStringRef.current = videoUrlString
  }, [node.id, videoUrlString, isCurrent, isRoot, hasVideo, setPlayingIds, videoOpacity])

  // Fade in once the native video reports it's ready
  useEffect(() => {
    if (!videoReady) return
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()
    
    // Auto-play after video is ready if we flagged it for auto-play
    if (shouldAutoPlayAfterResetRef.current) {
      shouldAutoPlayAfterResetRef.current = false
      setPlayingIds((prev) => ({
        ...prev,
        [node.id]: true,
      }))
    }
  }, [videoReady, videoOpacity, node.id, setPlayingIds])

  // Auto-play videos when they become current (TikTok-like behavior)
  useEffect(() => {
    if (!hasVideo) return
    
    if (isCurrent) {
      // Auto-play when card becomes current
      setPlayingIds((prev) => ({
        ...prev,
        [node.id]: true,
      }))
    } else if (!isCurrent) {
      // Pause when card is no longer current
      setPlayingIds((prev) => {
        if (!prev[node.id]) return prev
        const next = { ...prev }
        delete next[node.id]
        return next
      })
    }
  }, [isCurrent, hasVideo, node.id, setPlayingIds])

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
        ) : hasVideo ? (
          <>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />

            <Animated.View style={{ flex: 1, opacity: videoOpacity }}>
              {videoSource && (
                <Video
                  key={videoUrlString || node.id}
                  source={videoSource}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls={isPlaying}
                  shouldPlay={isPlaying}
                  isMuted={false}
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
              )}
            </Animated.View>

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
        ) : (
          <Image
            source={node.thumbnail as any}
            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          />
        )}
      </View>

      {(() => {
        const isDefaultRootTitle = node.title === "Start Here"
        const hasContent = (!!node.title && !isDefaultRootTitle) || !!node.notes || !!node.group || !!node.stage
        if (!hasContent) return null

        return (
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
              {node.title && !isDefaultRootTitle ? node.title : "Untitled Move"}
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
        )
      })()}
    </View>
  )
}
