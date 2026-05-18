import { supabase } from "@/lib/supabase"
import { sanitizeValue } from "@/utils/sanitizeValue"

const BACKGROUND_BUCKET = "backgrounds"
const MAX_BACKGROUND_BYTES = 5 * 1024 * 1024

export async function uploadBackgroundImage(file, userId = "anonimo") {
  if (!file) {
    throw new Error("Selecciona una imagen")
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("El fondo debe ser una imagen")
  }

  if (file.size > MAX_BACKGROUND_BYTES) {
    throw new Error("La imagen de fondo no puede superar 5 MB")
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "webp"
  const safeBaseName = sanitizeValue(
    file.name.replace(/\.[^.]+$/, "")
  ) || "fondo"
  const path = `${userId}/${Date.now()}-${safeBaseName}.${extension}`

  const { error } = await supabase.storage
    .from(BACKGROUND_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (error) {
    console.error(error)
    throw new Error(error.message || "Error subiendo fondo")
  }

  const { data } = supabase.storage
    .from(BACKGROUND_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}
