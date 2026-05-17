import { supabase } from "@/lib/supabase"

export async function getUserPreferences(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("app_user_id", userId)
    .maybeSingle()

  if (error) {
    console.error(error)
    return null
  }

  return data
}