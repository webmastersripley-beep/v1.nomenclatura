import { supabase } from "@/lib/supabase"

export async function getActiveCampaigns(country = "cl") {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      name,
      code,
      country,
      start_at,
      end_at,
      is_active
    `)
    .eq("is_active", true)
    .eq("country", country)
    .lte("start_at", now)
    .gte("end_at", now)
    .order("start_at", { ascending: true })

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

export async function getAllCampaigns(country = "cl") {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("country", country)
    .order("start_at", { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

export async function createCampaign({
  name,
  code,
  country,
  start_at,
  end_at,
  created_by_name,
  created_by_id,
}) {
  const normalizedCode = String(code || "")
    .trim()
    .toLowerCase()

  const startIso = normalizeDateToIso(start_at)
  const endIso = normalizeDateToIso(end_at)

  if (!startIso || !endIso) {
    throw new Error("Fechas inválidas")
  }

  if (new Date(endIso) <= new Date(startIso)) {
    throw new Error("La fecha de término debe ser posterior al inicio")
  }

  const overlappingCampaigns = await getOverlappingActiveCampaigns({
    country,
    start_at: startIso,
    end_at: endIso,
  })

  if (overlappingCampaigns.length >= 4) {
    throw new Error("Máximo 4 campañas simultáneas permitidas")
  }

  const payload = {
    name: String(name || "").trim(),
    code: normalizedCode,
    country,
    start_at: startIso,
    end_at: endIso,
    is_active: true,
    created_by_name,
    created_by_id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message || "Error creando campaña")
  }

  return data
}

export async function updateCampaign(id, payload) {
  const cleanPayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  }

  if (cleanPayload.start_at) {
    cleanPayload.start_at = normalizeDateToIso(cleanPayload.start_at)
  }

  if (cleanPayload.end_at) {
    cleanPayload.end_at = normalizeDateToIso(cleanPayload.end_at)
  }

  if (cleanPayload.code) {
    cleanPayload.code = String(cleanPayload.code).trim().toLowerCase()
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update(cleanPayload)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message || "Error actualizando campaña")
  }

  return data
}

export async function disableCampaign(id) {
  const { data, error } = await supabase
    .from("campaigns")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message || "Error desactivando campaña")
  }

  return data
}

export async function getOverlappingActiveCampaigns({
  country = "cl",
  start_at,
  end_at,
}) {
  const startIso = normalizeDateToIso(start_at)
  const endIso = normalizeDateToIso(end_at)

  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name, code, country, start_at, end_at, is_active")
    .eq("is_active", true)
    .eq("country", country)
    .lte("start_at", endIso)
    .gte("end_at", startIso)

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

function normalizeDateToIso(value) {
  if (!value) return null

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}