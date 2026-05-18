import { supabase } from "@/lib/supabase"

const CAMPAIGN_CODE_PATTERN = /^[a-z0-9-]+$/

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
  const payload = normalizeCampaignPayload({
    name,
    code,
    country,
    start_at,
    end_at,
    is_active: true,
  })

  await assertMaxSimultaneousCampaigns(payload)

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      ...payload,
      created_by_name,
      created_by_id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message || "Error creando campaña")
  }

  return data
}

export async function updateCampaign(id, payload) {
  const normalizedPayload = normalizeCampaignPayload(payload, {
    partial: true,
  })

  const currentCampaign = await getCampaignById(id)
  const mergedCampaign = {
    ...currentCampaign,
    ...normalizedPayload,
  }

  validateCampaignRange(mergedCampaign.start_at, mergedCampaign.end_at)

  if (mergedCampaign.is_active) {
    await assertMaxSimultaneousCampaigns(mergedCampaign, id)
  }

  const { data, error } = await supabase
    .from("campaigns")
    .update({
      ...normalizedPayload,
      updated_at: new Date().toISOString(),
    })
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
  return updateCampaign(id, {
    is_active: false,
  })
}

export async function reactivateCampaign(id) {
  return updateCampaign(id, {
    is_active: true,
  })
}

export async function getOverlappingActiveCampaigns({
  country = "cl",
  start_at,
  end_at,
  excludeId,
}) {
  const startIso = normalizeDateToIso(start_at)
  const endIso = normalizeDateToIso(end_at)

  let query = supabase
    .from("campaigns")
    .select("id, name, code, country, start_at, end_at, is_active")
    .eq("is_active", true)
    .eq("country", country)
    .lte("start_at", endIso)
    .gte("end_at", startIso)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

async function getCampaignById(id) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(error)
    throw new Error("No se pudo leer la campaña")
  }

  return data
}

async function assertMaxSimultaneousCampaigns(payload, excludeId) {
  const overlappingCampaigns = await getOverlappingActiveCampaigns({
    country: payload.country,
    start_at: payload.start_at,
    end_at: payload.end_at,
    excludeId,
  })

  if (overlappingCampaigns.length >= 4) {
    throw new Error("Máximo 4 campañas simultáneas permitidas")
  }
}

function normalizeCampaignPayload(payload, { partial = false } = {}) {
  const normalized = {}

  if (!partial || Object.hasOwn(payload, "name")) {
    const name = String(payload.name || "").trim()

    if (!partial && !name) {
      throw new Error("Nombre de campaña requerido")
    }

    if (name) {
      normalized.name = name
    }
  }

  if (!partial || Object.hasOwn(payload, "code")) {
    const code = String(payload.code || "")
      .trim()
      .toLowerCase()

    if (!partial && !code) {
      throw new Error("Código de campaña requerido")
    }

    if (code && !CAMPAIGN_CODE_PATTERN.test(code)) {
      throw new Error("El código solo puede usar letras, números y guiones")
    }

    if (code) {
      normalized.code = code
    }
  }

  if (!partial || Object.hasOwn(payload, "country")) {
    normalized.country = payload.country || "cl"
  }

  if (!partial || Object.hasOwn(payload, "start_at")) {
    const startIso = normalizeDateToIso(payload.start_at)

    if (!partial && !startIso) {
      throw new Error("Fecha de inicio inválida")
    }

    if (startIso) {
      normalized.start_at = startIso
    }
  }

  if (!partial || Object.hasOwn(payload, "end_at")) {
    const endIso = normalizeDateToIso(payload.end_at)

    if (!partial && !endIso) {
      throw new Error("Fecha de término inválida")
    }

    if (endIso) {
      normalized.end_at = endIso
    }
  }

  if (Object.hasOwn(payload, "is_active")) {
    normalized.is_active = Boolean(payload.is_active)
  }

  if (!partial) {
    validateCampaignRange(normalized.start_at, normalized.end_at)
  }

  return normalized
}

function validateCampaignRange(startAt, endAt) {
  if (!startAt || !endAt) {
    throw new Error("Fechas inválidas")
  }

  if (new Date(endAt) <= new Date(startAt)) {
    throw new Error("La fecha de término debe ser posterior al inicio")
  }
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
