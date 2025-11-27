import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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

const disableScrollJS = `
  (function() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  })();
  true;
`;

export default function Index() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const [axis, setAxis] = useState<Axis>("x");
  const lockedAxis = useRef<Axis | null>(null);

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const horizontalGap = 32;
  const verticalGap = 32;

  const cardWidth = screenWidth - 80;
  const cardHeight = Math.max(screenHeight * 0.55, 320);

  const distanceX = cardWidth + horizontalGap;
  const distanceY = cardHeight + verticalGap;

  const prevAvailable = currentIndex > 0;
  const nextAvailable = currentIndex < VIDEOS.length - 1;

  const renderIndices = useMemo(() => {
    const list: number[] = [currentIndex];
    if (prevAvailable) list.unshift(currentIndex - 1);
    if (nextAvailable) list.push(currentIndex + 1);
    return list;
  }, [currentIndex, prevAvailable, nextAvailable]);

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

      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      // Axis lock
      const slop = 10;
      const dominance = 1.2;
      if (!lockedAxis.current && (absX > slop || absY > slop)) {
        if (absX > absY * dominance) lockedAxis.current = "x";
        else if (absY > absX * dominance) lockedAxis.current = "y";
        if (lockedAxis.current) setAxis(lockedAxis.current);
      } else if (!lockedAxis.current) {
        setAxis(absX >= absY ? "x" : "y");
      }

      // Apply movement (kill off-axis when locked)
      const locked = lockedAxis.current;
      if (locked === "x") {
        translateX.setValue(translationX);
        translateY.setValue(0);
      } else if (locked === "y") {
        translateX.setValue(0);
        translateY.setValue(translationY);
      } else {
        translateX.setValue(translationX);
        translateY.setValue(translationY);
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

      springToZero(secondary);

      if (swipeNext) {
        timing(primary, -distance, () => {
          setCurrentIndex((i) => Math.min(i + 1, VIDEOS.length - 1));
          translateX.setValue(0);
          translateY.setValue(0);
          lockedAxis.current = null;
        });
      } else if (swipePrev) {
        timing(primary, distance, () => {
          setCurrentIndex((i) => Math.max(i - 1, 0));
          translateX.setValue(0);
          translateY.setValue(0);
          lockedAxis.current = null;
        });
      } else {
        springToZero(primary);
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

  // Outer frame will move with this transform
  const stageTransform = [{ translateX }, { translateY }];

  const outerWidth = cardWidth + horizontalGap * 2;
  const outerHeight = cardHeight + verticalGap * 2;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handleGestureEvent} onEnded={handleGestureEnd}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0d12" }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {/* OUTER BOX NOW MOVES (frame + arrows + inner stack all move together) */}
              <Animated.View
                style={{
                  width: outerWidth,
                  height: outerHeight,
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 20,
                  borderWidth: 1,
                  padding: 12,
                  overflow: "visible", // keep arrows visible in gap
                  transform: stageTransform,
                }}
              >
                {/* Card stack container (does NOT have the transform now) */}
                <View
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    position: "relative",
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
                          zIndex: 1,
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
                            androidLayerType="software"
                            injectedJavaScript={disableScrollJS}
                            scrollEnabled={false}
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            renderToHardwareTextureAndroid={false}
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
                            {video.title}
                          </Text>
                          <Text style={{ color: "#94a3b8", fontSize: 16 }}>
                            Video {i + 1} of {VIDEOS.length} - swipe to change
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Arrows are inside the OUTER box, so they move with it too */}
                {VIDEOS.length > 1 && (
                  <>
                    {/* Horizontal arrows */}
                    {nextAvailable && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          zIndex: 50,
                          elevation: 50,
                          right: 4,
                          top: outerHeight / 2 - 12,
                        }}
                      >
                        <MaterialIcons
                          name="arrow-forward-ios"
                          size={24}
                          color="rgba(148,163,184,0.8)"
                        />
                      </View>
                    )}
                    {prevAvailable && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          zIndex: 50,
                          elevation: 50,
                          left: 4,
                          top: outerHeight / 2 - 12,
                        }}
                      >
                        <MaterialIcons
                          name="arrow-back-ios"
                          size={24}
                          color="rgba(148,163,184,0.8)"
                        />
                      </View>
                    )}

                    {/* Vertical arrows */}
                    {nextAvailable && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          zIndex: 50,
                          elevation: 50,
                          left: outerWidth / 2 - 12,
                          bottom: 4,
                        }}
                      >
                        <MaterialIcons
                          name="arrow-downward"
                          size={24}
                          color="rgba(148,163,184,0.8)"
                        />
                      </View>
                    )}
                    {prevAvailable && (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          zIndex: 50,
                          elevation: 50,
                          left: outerWidth / 2 - 12,
                          top: 4,
                        }}
                      >
                        <MaterialIcons
                          name="arrow-upward"
                          size={24}
                          color="rgba(148,163,184,0.8)"
                        />
                      </View>
                    )}
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
