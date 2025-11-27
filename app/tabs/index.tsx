import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Text,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const VIDEOS = [
  { id: "dQw4w9WgXcQ", title: "Warmup basics" },
  { id: "9bZkp7q19f0", title: "Footwork drills" },
  { id: "3JZ_D3ELwOQ", title: "Combo highlights" },
];

const buildEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;

type Axis = "x" | "y";

export default function Index() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Track X and Y separately so both lines can animate together.
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Which axis we currently consider the "active" swipe axis (for layout + snap).
  const [axis, setAxis] = useState<Axis>("x");
  const lockedAxis = useRef<Axis | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const horizontalGap = 32;
  const verticalGap = 32;

  const cardWidth = screenWidth - 32;
  const cardHeight = Math.max(screenHeight * 0.55, 320);

  const distanceX = cardWidth + horizontalGap;
  const distanceY = cardHeight + verticalGap;

  const prevAvailable = currentIndex > 0;
  const nextAvailable = currentIndex < VIDEOS.length - 1;

  // Render just current + immediate neighbours. Positioned relative to currentIndex.
  const renderIndices = useMemo(() => {
    const list: number[] = [currentIndex];
    if (prevAvailable) list.unshift(currentIndex - 1);
    if (nextAvailable) list.push(currentIndex + 1);
    return list;
  }, [currentIndex, prevAvailable, nextAvailable]);

  // Horizontal line length reacts to X drag, vertical line length reacts to Y drag.
  const hLen = translateX.interpolate({
    inputRange: [-distanceX, 0, distanceX],
    outputRange: [distanceX * 2, distanceX, distanceX * 2],
    extrapolate: "clamp",
  });

  const vLen = translateY.interpolate({
    inputRange: [-distanceY, 0, distanceY],
    outputRange: [distanceY * 2, distanceY, distanceY * 2],
    extrapolate: "clamp",
  });

  const resetDrag = useCallback(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    lockedAxis.current = null;
  }, [translateX, translateY]);

  const timing = useCallback(
    (val: Animated.Value, toValue: number, onDone?: () => void) => {
      Animated.timing(val, {
        toValue,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    },
    []
  );

  const springToZero = useCallback((val: Animated.Value) => {
    Animated.spring(val, { toValue: 0, useNativeDriver: true }).start();
  }, []);

  const handleGestureEvent = useCallback(
    ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
      const { translationX, translationY } = nativeEvent;

      // Always update both so both lines can render.
      translateX.setValue(translationX);
      translateY.setValue(translationY);

      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      // Lock axis once the user commits a bit, but also keep axis feeling responsive.
      const slop = 6;
      if (!lockedAxis.current && (absX > slop || absY > slop)) {
        lockedAxis.current = absX >= absY ? "x" : "y";
        setAxis(lockedAxis.current);
      } else if (!lockedAxis.current) {
        // Before lock, keep axis aligned to dominant direction to avoid "wrong line/position" flashes.
        setAxis(absX >= absY ? "x" : "y");
      }
    },
    [translateX, translateY]
  );

  const handleGestureEnd = useCallback(
    ({ nativeEvent }: PanGestureHandlerGestureEvent) => {
      const { translationX, translationY } = nativeEvent;

      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      const activeAxis: Axis = lockedAxis.current ?? (absX >= absY ? "x" : "y");
      setAxis(activeAxis);

      const threshold = 60;
      const distance = activeAxis === "x" ? distanceX : distanceY;
      const t = activeAxis === "x" ? translationX : translationY;

      const canNext = currentIndex < VIDEOS.length - 1;
      const canPrev = currentIndex > 0;

      const swipeNext = -t > threshold && canNext;
      const swipePrev = t > threshold && canPrev;

      const primary = activeAxis === "x" ? translateX : translateY;
      const secondary = activeAxis === "x" ? translateY : translateX;

      // Secondary axis should always settle back.
      springToZero(secondary);

      if (swipeNext) {
        timing(primary, -distance, () => {
          setCurrentIndex((i) => Math.min(i + 1, VIDEOS.length - 1));
          primary.setValue(0);
          secondary.setValue(0);
          lockedAxis.current = null;
        });
      } else if (swipePrev) {
        timing(primary, distance, () => {
          setCurrentIndex((i) => Math.max(i - 1, 0));
          primary.setValue(0);
          secondary.setValue(0);
          lockedAxis.current = null;
        });
      } else {
        springToZero(primary);
        // Keep whichever was locked cleared.
        lockedAxis.current = null;
      }
    },
    [
      currentIndex,
      distanceX,
      distanceY,
      springToZero,
      timing,
      translateX,
      translateY,
    ]
  );

  const stageTransform =
    axis === "x"
      ? [{ translateX }, { translateY: new Animated.Value(0) }]
      : [{ translateX: new Animated.Value(0) }, { translateY }];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handleGestureEvent} onEnded={handleGestureEnd}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
          <View style={{ flex: 1, padding: 16, gap: 12 }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {/* Stage is one-card size. Neighbours live off-screen at +/-distance. */}
              <Animated.View
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  position: "relative",
                  transform: stageTransform,
                }}
              >
                {renderIndices.map((i) => {
                  const video = VIDEOS[i];
                  const delta = i - currentIndex;

                  const left = axis === "x" ? delta * distanceX : 0;
                  const top = axis === "y" ? delta * distanceY : 0;

                  return (
                    <View
                      key={video.id}
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width: cardWidth,
                        height: cardHeight,
                        borderRadius: 16,
                        overflow: "hidden",
                        backgroundColor: "#111827",
                        borderWidth: 1,
                        borderColor: "#f97316",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <WebView
                          source={{ uri: buildEmbedUrl(video.id) }}
                          allowsFullscreenVideo
                          allowsInlineMediaPlayback
                          startInLoadingState
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
                      </View>

                      <View
                        style={{
                          padding: 12,
                          borderTopWidth: 1,
                          borderTopColor: "rgba(249,115,22,0.35)",
                          backgroundColor: "#0f172a",
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{ color: "#f8fafc", fontSize: 18, fontWeight: "700" }}
                          numberOfLines={1}
                        >
                          {video.title}
                        </Text>
                        <Text style={{ color: "#94a3b8" }}>
                          Video {i + 1} of {VIDEOS.length} - swipe to change
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Crosshair connector lines (both at once). */}
                {VIDEOS.length > 1 && (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        zIndex: -1,
                        left: cardWidth / 2 - 2,
                        top: cardHeight / 2 - 2,
                        width: hLen,
                        height: 4,
                        backgroundColor: "rgba(148,163,184,0.5)",
                        transform: [{ translateX: Animated.multiply(hLen, -0.5) }],
                      }}
                    />
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        zIndex: -1,
                        left: cardWidth / 2 - 2,
                        top: cardHeight / 2 - 2,
                        width: 4,
                        height: vLen,
                        backgroundColor: "rgba(148,163,184,0.5)",
                        transform: [{ translateY: Animated.multiply(vLen, -0.5) }],
                      }}
                    />
                  </>
                )}
              </Animated.View>
            </View>
          </View>
        </SafeAreaView>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}
