// Shared video helpers for technique nodes. Cards own the actual rendering.
import type { AVPlaybackSource } from "expo-av"

export const moveVideoMap: Record<string, AVPlaybackSource> = {
  stage1_double_leg: require("../assets/Move Videos/double leg 2.mp4"),
  stage1_body_lock_trip: require("../assets/Move Videos/Bodylock trip.mp4"),
  stage1_single_leg_snap: require("../assets/Move Videos/double leg.mp4"),
  stage1_guard_pull_closed: require("../assets/Move Videos/double leg.mp4"),
  stage1_arm_drag_to_back: require("../assets/Move Videos/double leg.mp4"),
  stage2a_posture_break: require("../assets/Move Videos/double leg.mp4"),
  stage2a_knee_slice_pass: require("../assets/Move Videos/double leg.mp4"),
  stage2a_double_under_pass: require("../assets/Move Videos/double leg.mp4"),
  stage2a_torreando_pass: require("../assets/Move Videos/double leg.mp4"),
  stage2a_leg_drag_pass: require("../assets/Move Videos/double leg.mp4"),
  stage2b_closed_guard_control: require("../assets/Move Videos/double leg.mp4"),
  stage2b_hip_bump: require("../assets/Move Videos/double leg.mp4"),
  stage2b_scissor_sweep: require("../assets/Move Videos/double leg.mp4"),
  stage2b_flower_sweep: require("../assets/Move Videos/double leg.mp4"),
  stage2b_kimura_guard: require("../assets/Move Videos/double leg.mp4"),
  stage2b_cross_collar_guard: require("../assets/Move Videos/double leg.mp4"),
  stage2b_triangle_choke: require("../assets/Move Videos/double leg.mp4"),
  stage2b_bad_half_escape: require("../assets/Move Videos/double leg.mp4"),
  stage2b_bad_turtle: require("../assets/Move Videos/double leg.mp4"),
  stage2c_front_headlock_spin: require("../assets/Move Videos/double leg.mp4"),
  stage2c_wrestle_up_single: require("../assets/Move Videos/double leg.mp4"),
  stage2_open_guard_control: require("../assets/Move Videos/double leg.mp4"),
  stage2_tripod_sweep: require("../assets/Move Videos/double leg.mp4"),
  stage2_sickle_sweep: require("../assets/Move Videos/double leg.mp4"),
  stage2_technical_standup: require("../assets/Move Videos/double leg.mp4"),
  stage2_half_guard_control: require("../assets/Move Videos/double leg.mp4"),
  stage2_old_school_sweep: require("../assets/Move Videos/double leg.mp4"),
  stage2_half_guard_knee_cut: require("../assets/Move Videos/double leg.mp4"),
  stage3_side_control: require("../assets/Move Videos/double leg.mp4"),
  stage3_knee_on_belly: require("../assets/Move Videos/double leg.mp4"),
  stage3_mount: require("../assets/Move Videos/double leg.mp4"),
  stage3_back_control: require("../assets/Move Videos/double leg.mp4"),
  stage4_rnc: require("../assets/Move Videos/double leg.mp4"),
  stage4_cross_collar_mount: require("../assets/Move Videos/double leg.mp4"),
  stage4_armbar_mount: require("../assets/Move Videos/double leg.mp4"),
  stage4_kimura_side: require("../assets/Move Videos/double leg.mp4"),
  stage4_bow_and_arrow: require("../assets/Move Videos/double leg.mp4"),
  stage4_straight_ankle: require("../assets/Move Videos/double leg.mp4"),
}

const looksLikeYouTubeId = (value: string) => /^[a-zA-Z0-9_-]{6,}$/.test(value) && !value.includes("/")

const parseYouTubeTimeToSeconds = (raw: string): number | null => {
  const v = raw.trim().toLowerCase()

  // plain seconds: "16" or "301" or "301s"
  if (/^\d+s?$/.test(v)) return parseInt(v.replace("s", ""), 10)

  // formats like 1h2m3s, 2m10s, 1m, 45s
  const m = v.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!m) return null

  const h = m[1] ? parseInt(m[1], 10) : 0
  const min = m[2] ? parseInt(m[2], 10) : 0
  const s = m[3] ? parseInt(m[3], 10) : 0

  const total = h * 3600 + min * 60 + s
  return Number.isFinite(total) && total > 0 ? total : null
}

export const toYouTubeEmbed = (raw?: string | null) => {
  if (!raw) return null

  // If someone passes an ID instead of a URL, treat it like a watch URL.
  const candidate = looksLikeYouTubeId(raw) ? `https://www.youtube.com/watch?v=${raw}` : raw

  try {
    const parsed = new URL(candidate)
    const hostname = parsed.hostname.replace(/^www\./, "")

    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }

    if (hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return `https://www.youtube.com${parsed.pathname}`
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const [, , videoId] = parsed.pathname.split("/")
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null
      }
      const videoId = parsed.searchParams.get("v")
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    }
  } catch {
    return null
  }

  return null
}

/**
 * Like toYouTubeEmbed, but preserves timestamps (t=) and adds sane embed params.
 * Produces:
 *   https://www.youtube.com/embed/<id>?rel=0&playsinline=1&start=22
 */
export const toYouTubeEmbedWithParams = (raw?: string | null) => {
  if (!raw) return null

  const candidate = looksLikeYouTubeId(raw) ? `https://www.youtube.com/watch?v=${raw}` : raw

  const base = toYouTubeEmbed(candidate)
  if (!base) return null

  let startSeconds: number | null = null

  try {
    const u = new URL(candidate)

    // Most common: ?t=22s or &t=301s
    const t = u.searchParams.get("t")
    if (t) startSeconds = parseYouTubeTimeToSeconds(t)

    // Sometimes: #t=123
    if (startSeconds == null) {
      const hm = u.hash.match(/t=(\d+)/)
      if (hm?.[1]) startSeconds = parseInt(hm[1], 10)
    }

    // Sometimes already: ?start=SECONDS
    if (startSeconds == null) {
      const s = u.searchParams.get("start")
      if (s && /^\d+$/.test(s)) startSeconds = parseInt(s, 10)
    }
  } catch {
    // ignore
  }

  const params = new URLSearchParams({
    rel: "0",
    playsinline: "1",
  })

  if (startSeconds != null && Number.isFinite(startSeconds) && startSeconds > 0) {
    params.set("start", String(startSeconds))
  }

  return `${base}?${params.toString()}`
}

// Default export so Expo Router treats this file as a (no-op) route component.
// This returns null because the file only exposes helpers.
const TechniqueVideoRoutePlaceholder = () => null
export default TechniqueVideoRoutePlaceholder

