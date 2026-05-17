import { supabase } from "@/lib/supabase"

export async function findUserByName(name) {
  const cleanName = name.trim()

  const { data, error } = await supabase
    .from("app_users")
    .select("id, name, is_active")
    .ilike("name", cleanName)
    .eq("is_active", true)
    .single()

  if (error) {
    return null
  }

  return data
}