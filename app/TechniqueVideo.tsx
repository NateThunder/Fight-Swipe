// Shared video helpers for technique nodes. Cards own the actual WebView rendering.
import React from "react"

export const moveVideoMap: Record<string, string> = {
  stage1_double_leg: "https://www.youtube.com/watch?v=4DHzLvLd-0Y",
  stage1_body_lock_trip: "https://www.youtube.com/watch?v=xagOTpxeliE&t=22s",
  stage1_single_leg_snap: "https://www.youtube.com/watch?v=mCRx-fBm8zE&t=301s",
  stage1_guard_pull_closed: "https://www.youtube.com/watch?v=JDJYWBbzspQ",
  stage1_arm_drag_to_back: "https://www.youtube.com/watch?v=e_c7G5T_ZR8&t=191s",
  stage2a_posture_break: "https://www.youtube.com/watch?v=IJx92rHqtfg",
  stage2a_knee_slice_pass: "https://www.youtube.com/watch?v=Hcjo1LI4LKw",
  stage2a_double_under_pass: "https://www.youtube.com/watch?v=PizdshB63kw",
  stage2a_torreando_pass: "https://www.youtube.com/watch?v=dIMMnofqOXk",
  stage2a_leg_drag_pass: "https://www.youtube.com/watch?v=x5AsEhq3bio",
  stage2b_closed_guard_control: "https://www.youtube.com/watch?v=zXpFhLK5MQI",
  stage2b_hip_bump: "https://www.youtube.com/watch?v=9gOLkgms0QU",
  stage2b_scissor_sweep: "https://www.youtube.com/watch?v=UBf7uF5x8GQ",
  stage2b_flower_sweep: "https://www.youtube.com/watch?v=NEzVVhg2p5c",
  stage2b_kimura_guard: "https://www.youtube.com/watch?v=mVkKOPNGvjA",
  stage2b_cross_collar_guard: "https://www.youtube.com/watch?v=6yQGBRR9yqY",
  stage2b_triangle_choke: "https://www.youtube.com/watch?v=VA6zjDN690s",
  stage2b_bad_half_escape: "https://www.youtube.com/watch?v=tcS7oBdpRW0",
  stage2b_bad_turtle: "https://www.youtube.com/watch?v=-BYPW3FwG7I&t=43s",
  stage2c_front_headlock_spin: "https://www.youtube.com/watch?v=dU5Lv_PQeQM",
  stage2c_wrestle_up_single: "https://www.youtube.com/shorts/CYK5RmnlRHw",
  stage2_open_guard_control: "https://www.youtube.com/watch?v=LPet-GrNNB8",
  stage2_tripod_sweep: "https://www.youtube.com/watch?v=Q5RS_5uwgIk",
  stage2_sickle_sweep: "https://www.youtube.com/watch?v=WryGCOlJMZ4",
  stage2_technical_standup: "https://www.youtube.com/watch?v=4yc0Swz_El0",
  stage2_half_guard_control: "https://www.youtube.com/watch?v=15kus9CLg2s",
  stage2_old_school_sweep: "https://www.youtube.com/watch?v=Jnc2siD9cak",
  stage2_half_guard_knee_cut: "https://www.youtube.com/watch?v=1guSnAAkPC0",
  stage3_side_control: "https://www.youtube.com/watch?v=nDbHQPBvQvQ",
  stage3_knee_on_belly: "https://www.youtube.com/watch?v=7DbaY0BtuWk",
  stage3_mount: "https://www.youtube.com/watch?v=u_bMy3mQjro",
  stage3_back_control: "https://www.youtube.com/watch?v=VlsiWgXF9SI",
  stage4_rnc: "https://www.youtube.com/shorts/oYDe-hrazL8",
  stage4_cross_collar_mount: "https://www.youtube.com/watch?v=Krl3t53gVYY",
  stage4_armbar_mount: "https://www.youtube.com/watch?v=ECPcvbKt-lY",
  stage4_kimura_side: "https://www.youtube.com/watch?v=QT0TqceznpQ",
  stage4_bow_and_arrow: "https://www.youtube.com/watch?v=xqNhZVNhxnE",
  stage4_straight_ankle: "https://youtu.be/JD3QucUWIwI?si=2IwKpRGBIWGdrt8I&t=16",
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

