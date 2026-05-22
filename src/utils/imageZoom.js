const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.25

export function getNextImageZoom(currentZoom, action) {
  if (action === "reset") return 1

  const direction = action === "out" ? -1 : 1
  const nextZoom = currentZoom + (ZOOM_STEP * direction)

  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
}
