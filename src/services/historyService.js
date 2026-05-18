import { supabase } from "@/lib/supabase"

export async function getProcessHistory({
  userName = "",
  campaign = "",
  limit = 50,
} = {}) {
  let query = supabase
    .from("processes")
    .select(`
      id,
      created_at,
      total_files,
      total_families,
      country,
      campaign,
      app_user_id,
      app_user_name
    `)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (userName.trim()) {
    query = query.ilike("app_user_name", `%${userName.trim()}%`)
  }

  if (campaign.trim()) {
    query = query.ilike("campaign", `%${campaign.trim()}%`)
  }

  const { data: processes, error: processError } = await query

  if (processError) {
    console.error(processError)
    throw new Error("Error cargando historial")
  }

  if (!processes?.length) {
    return []
  }

  const processIds = processes.map((process) => process.id)

  const { data: items, error: itemError } = await supabase
    .from("process_items")
    .select(`
      process_id,
      original_name,
      final_name,
      piece,
      format,
      category,
      brand,
      compressed,
      original_size,
      compressed_size
    `)
    .in("process_id", processIds)

  if (itemError) {
    console.error(itemError)
    throw new Error("Error cargando archivos del historial")
  }

  const itemsByProcess = (items || []).reduce((accumulator, item) => {
    if (!accumulator[item.process_id]) {
      accumulator[item.process_id] = []
    }

    accumulator[item.process_id].push(item)
    return accumulator
  }, {})

  return processes.map((process) => ({
    ...process,
    items: itemsByProcess[process.id] || [],
  }))
}
