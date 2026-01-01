export const extractYouTubeId = (raw?: string | null) => {
  if (!raw) return null
  if (/^[a-zA-Z0-9_-]{6,}$/.test(raw) && !raw.includes("/")) return raw
  const short = /youtu\.be\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (short?.[1]) return short[1]
  const watch = /[?&]v=([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (watch?.[1]) return watch[1]
  const shorts = /shorts\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (shorts?.[1]) return shorts[1]
  const embed = /embed\/([a-zA-Z0-9_-]{6,})/.exec(raw)
  if (embed?.[1]) return embed[1]
  return null
}
