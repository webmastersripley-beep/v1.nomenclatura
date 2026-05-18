import { supabase } from "@/lib/supabase"
import { validateConfiguration } from "@/utils/validateConfiguration"

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

export async function saveUserPreferences({

  app_user_id,

  default_country,

  default_campaign,

  download_mode,

  use_active_campaigns,

  theme_preset,

  background_type,

  background_image_url,

  background_opacity,

  enable_blobs,

  descriptor_mode,
}) {

  if (!app_user_id) {
    return null
  }

  const payload = {

    app_user_id,

    default_country:
      default_country || "cl",

    default_campaign:
      default_campaign || "hg",

    download_mode:
      download_mode ||
      "por-familia",

    use_active_campaigns:
      use_active_campaigns
      ?? true,

    theme_preset:
      theme_preset ||
      "midnight",

    background_type:
      background_type ||
      "gradient",

    background_image_url:
      background_image_url ||
      "",

    background_opacity:
      background_opacity
      ?? 0.15,

    enable_blobs:
      enable_blobs
      ?? true,

    descriptor_mode:
      descriptor_mode ||
      "category",

    updated_at:
      new Date()
        .toISOString(),
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
