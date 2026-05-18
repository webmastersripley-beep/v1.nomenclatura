import { DESCRIPTOR_MODES } from "@/utils/buildFinalName"

export const VALID_THEME_PRESETS = [
  "midnight",
  "cyber",
  "ocean",
  "sunset",
  "luxury",
]

export const VALID_BACKGROUND_TYPES = [
  "gradient",
  "image",
  "mixed",
]

export function isValidHttpUrl(value) {
  if (!value) return true

  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol)
  } catch {
    return false
  }
}

export function validateConfiguration({
  theme_preset,
  background_type,
  background_image_url,
  background_opacity,
  descriptor_mode,
}) {
  const errors = []

  if (!VALID_THEME_PRESETS.includes(theme_preset)) {
    errors.push("Tema visual inválido")
  }

  if (!VALID_BACKGROUND_TYPES.includes(background_type)) {
    errors.push("Tipo de fondo inválido")
  }

  if (!DESCRIPTOR_MODES.includes(descriptor_mode)) {
    errors.push("Descriptor inválido")
  }

  if (!isValidHttpUrl(background_image_url)) {
    errors.push("La URL de fondo debe ser http(s) válida")
  }

  if (
    typeof background_opacity !== "number" ||
    Number.isNaN(background_opacity) ||
    background_opacity < 0 ||
    background_opacity > 1
  ) {
    errors.push("La opacidad debe estar entre 0 y 1")
  }

  return errors
}
