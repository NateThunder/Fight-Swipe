import type { AVPlaybackSource } from "expo-av"

// Map move ids to thumbnail assets. Update paths as you add real images.
export const moveThumbs: Record<string, AVPlaybackSource | { uri: string }> = {
  // Placeholder thumbnails: using video files as stand-ins until real images exist.
  stage1_double_leg: require("../assets/Move Videos/double leg 2.mp4"),
  stage1_body_lock_trip: require("../assets/Move Videos/Bodylock trip.mp4"),
}
