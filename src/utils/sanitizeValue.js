export function sanitizeValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value)
    .toLowerCase()
    .replace(/ñ/g, "n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/\s+/g, "-")
    .replace(/_+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "")
    .replace(/-$/, "")
    .trim()
}

export function sanitizeTags(tags) {
  if (!Array.isArray(tags)) {
    return []
  }

  const cleaned = tags.map((tag) =>
    sanitizeValue(tag)
  )

  return [...new Set(cleaned)]
    .filter(Boolean)
}