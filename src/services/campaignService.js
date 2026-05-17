import { supabase } from "@/lib/supabase"

export async function getActiveCampaigns(country = "cl") {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, code, country, start_date, end_date")
    .eq("is_active", true)
    .eq("country", country)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}