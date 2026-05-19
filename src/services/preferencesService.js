import { supabase } from "@/lib/supabase"
import { validateConfiguration } from "@/utils/validateConfiguration"

const DEFAULT_PREFERENCES = {
  default_country: "cl",
  default_campaign: "hg",
  download_mode: "por-familia",
  use_active_campaigns: true,
  theme_preset: "midnight",
  background_type: "gradient",
  background_image_url: "",
  background_opacity: 0.15,
  enable_blobs: true,
  descriptor_mode: "category",
}

export async function getUserPreferences(
  userId
) {

  if (!userId) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from("user_preferences")
    .select("*")
    .eq(
      "app_user_id",
      userId
    )
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data
}

export async function saveUserPreferences(
  partialPreferences
) {
  const appUserId =
    partialPreferences?.app_user_id

  if (!appUserId) {
    return null
  }

  const existingPreferences =
    await getUserPreferences(appUserId)

  const payload = {
    ...DEFAULT_PREFERENCES,
    ...(existingPreferences || {}),
    ...removeUndefinedValues(partialPreferences),
    app_user_id: appUserId,
    updated_at: new Date().toISOString(),
  }

  const configurationErrors =
    validateConfiguration(payload)

  if (configurationErrors.length > 0) {
    throw new Error(configurationErrors[0])
  }

  const {
    data,
    error,
  } = await supabase
    .from("user_preferences")
    .upsert(payload, {
      onConflict:
        "app_user_id",
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(
      "Error guardando preferencias"
    )
  }

  return data
}

function removeUndefinedValues(value) {
  return Object.fromEntries(
    Object.entries(value || {}).filter(
      ([, item]) => item !== undefined
    )
  )
}
