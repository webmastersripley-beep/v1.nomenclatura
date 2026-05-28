import { supabase } from "@/lib/supabase"
import { useUserStore } from "@/store/useUserStore"
import { buildZipManifest } from "@/utils/buildZipEntries"
import {
  CYBER_NOMENCLATURE_RULES_VERSION,
  getFolderForPiece,
} from "@/utils/cyberNomenclatureRules"
import { getRuleProfileVersion } from "@/utils/ruleProfiles"

export async function startProcessAudit(groupedData, { config = {} } = {}) {
  if (!isSupabaseConfigured()) return null

  const user = useUserStore.getState().user
  const allFiles = getAllAuditFiles(groupedData)
  const uniqueFamilies = new Set(
    (groupedData?.families || []).map((family) => family.familyId)
  )

  const { data, error } = await supabase
    .from("processes")
    .insert({
      total_files: allFiles.length,
      total_families: uniqueFamilies.size,
      country: config.country || "",
      campaign: config.campaign || "",
      app_user_id: user?.id || null,
      app_user_name: user?.name || "anonimo",
      status: "uploaded",
      current_stage: "upload",
      rule_profile: config.ruleProfile || "generic",
      rules_version:
        getRuleProfileVersion(config.ruleProfile) ||
        CYBER_NOMENCLATURE_RULES_VERSION,
      source_summary: {
        automatic_files: groupedData?.families?.flatMap((family) => family.files).length || 0,
        manual_files: groupedData?.manualFiles?.length || 0,
      },
    })
    .select()
    .single()

  if (error) throw new Error("Error creando auditoria en Supabase")

  await syncReviewAudit(data.id, groupedData, {
    status: "classified",
    currentStage: "review",
  })

  return data
}

export async function syncReviewAudit(
  processId,
  groupedData,
  {
    status = "reviewing",
    currentStage = "review",
  } = {}
) {
  if (!processId || !isSupabaseConfigured()) return null

  const families = groupedData?.families || []
  const manualFiles = groupedData?.manualFiles || []
  const allFiles = getAllAuditFiles(groupedData)
  const processPatch = {
    status,
    current_stage: currentStage,
    total_files: allFiles.length,
    total_families: families.length,
    review_synced_at: new Date().toISOString(),
  }

  if (status === "classified") {
    processPatch.classified_at = new Date().toISOString()
  }

  const { error: processError } = await supabase
    .from("processes")
    .update(processPatch)
    .eq("id", processId)

  if (processError) throw new Error("Error actualizando auditoria")

  await upsertFamilies(processId, families)
  await upsertItems(processId, families, manualFiles)

  return true
}

export async function recordProcessEvent(processId, event) {
  if (!processId || !isSupabaseConfigured()) return null

  const { error } = await supabase
    .from("process_item_events")
    .insert({
      process_id: processId,
      event_type: event.type,
      original_name: event.originalName || null,
      source_family_id: event.sourceFamilyId || null,
      target_family_id: event.targetFamilyId || null,
      payload: event.payload || {},
    })

  if (error) {
    console.error(error)
    return null
  }

  return true
}

export async function completeProcessAudit(
  processId,
  results,
  {
    batchName = "",
    downloadMode = "",
    zipBlob = null,
  } = {}
) {
  if (!isSupabaseConfigured()) return null

  const activeProcessId =
    processId ||
    await createFallbackProcess(results, {
      batchName,
      downloadMode,
    })

  const manifest = buildZipManifest(results, downloadMode || "por-familia")
  const pathByOriginalName = new Map(
    manifest.map(({ item, path }) => [item.originalName, path])
  )

  await upsertFinalItems(activeProcessId, results, pathByOriginalName)

  let storagePath = null

  if (zipBlob) {
    storagePath = await uploadProcessZip(activeProcessId, batchName, zipBlob)
  }

  const { data, error } = await supabase
    .from("processes")
    .update({
      status: "completed",
      current_stage: "download",
      batch_name: batchName.trim() || null,
      download_mode: downloadMode || null,
      zip_storage_path: storagePath,
      zip_size: zipBlob?.size || null,
      saved_after_download_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq("id", activeProcessId)
    .select()
    .single()

  if (error) throw new Error("Error cerrando auditoria del proceso")

  return data
}

function getAllAuditFiles(groupedData = {}) {
  return [
    ...(groupedData.families || []).flatMap((family) => family.files || []),
    ...(groupedData.manualFiles || []),
  ]
}

async function upsertFamilies(processId, families) {
  if (!families.length) return

  const rows = families.map((family) => ({
    process_id: processId,
    family_id: family.familyId,
    family_key: family.familyKey || "",
    base_piece: family.basePiece || "",
    initial_piece: family.originalPiece || family.piece || "",
    final_piece: family.piece || "",
    final_family: family.files?.[0]?.finalFamily || "",
    rule_profile: family.files?.[0]?.ruleProfile || "",
    world_code: family.files?.[0]?.worldCode || "",
    world_name: family.files?.[0]?.worldName || "",
    group_number: family.groupNumber || null,
    folder_group: family.folderGroup || getFolderForPiece(family.piece, family.files?.[0]?.finalFamily),
    is_manual_created: Boolean(family.isManualCreated),
    files_count: family.files?.length || 0,
    formats: [...new Set((family.files || []).map((file) => file.format || file.detectedFormat).filter(Boolean))],
    status: family.isPlaceholder ? "placeholder" : "active",
    payload: {
      files: (family.files || []).map((file) => file.originalName),
      world: {
        confidence: family.files?.[0]?.worldConfidence || "",
        status: family.files?.[0]?.worldStatus || "",
        reasons: family.files?.[0]?.worldReasons || [],
      },
    },
  }))

  const { error } = await supabase
    .from("process_families")
    .upsert(rows, {
      onConflict: "process_id,family_id",
    })

  if (error) throw new Error("Error guardando familias del proceso")
}

async function upsertItems(processId, families, manualFiles) {
  const automaticRows = families.flatMap((family) =>
    (family.files || []).map((file) =>
      buildItemRow(processId, file, {
        family,
        manualStatus: "automatic",
      })
    )
  )
  const manualRows = manualFiles.map((file) =>
    buildItemRow(processId, file, {
      family: null,
      manualStatus: "manual",
    })
  )
  const rows = [...automaticRows, ...manualRows]

  if (!rows.length) return

  const { error } = await supabase
    .from("process_items")
    .upsert(rows, {
      onConflict: "process_id,original_name",
    })

  if (error) throw new Error("Error guardando imagenes del proceso")
}

async function upsertFinalItems(processId, results, pathByOriginalName) {
  const rows = results.map((item) => {
    const zipPath = pathByOriginalName.get(item.originalName) || ""

    return {
      ...buildItemRow(processId, item, {
        family: {
          familyId: item.familyId,
          familyKey: item.familyKey,
          piece: item.piece,
          folderGroup: item.folderGroup,
        },
        manualStatus: "final",
      }),
      final_name: item.finalName,
      piece: item.piece,
      final_piece: item.piece,
      rule_profile: item.ruleProfile || "",
      world_code: item.worldCode || "",
      world_name: item.worldName || "",
      world_confidence: item.worldConfidence || "",
      world_status: item.worldStatus || "",
      world_reasons: Array.isArray(item.worldReasons) ? item.worldReasons : [],
      category: item.category || "",
      brand: item.brand || "",
      product: item.product || "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      compressed: Boolean(item.compressed),
      original_size: item.originalSize || item.file?.size || null,
      compressed_size: item.compressedSize || null,
      zip_path: zipPath,
      zip_folder: zipPath.split("/")[0] || "",
    }
  })

  if (!rows.length) return

  const { error } = await supabase
    .from("process_items")
    .upsert(rows, {
      onConflict: "process_id,original_name",
    })

  if (error) throw new Error("Error guardando resultado final")
}

function buildItemRow(
  processId,
  file,
  {
    family,
    manualStatus,
  }
) {
  const folderGroup =
    file.folderGroup ||
    family?.folderGroup ||
    getFolderForPiece(file.piece, file.finalFamily)

  return {
    process_id: processId,
    original_name: file.originalName || "sin-nombre.webp",
    final_name: file.finalName || "",
    piece: file.piece || "",
    format: file.format || file.detectedFormat || "",
    category: file.category || "",
    brand: file.brand || "",
    product: file.product || "",
    tags: Array.isArray(file.tags) ? file.tags : [],
    compressed: Boolean(file.compressed),
    original_size: file.originalSize || file.file?.size || null,
    compressed_size: file.compressedSize || null,
    width: file.width || null,
    height: file.height || null,
    dimension: file.dimension || "",
    ratio: file.ratio || null,
    name_family: file.nameFamily || null,
    size_family: file.sizeFamily || null,
    final_family: file.finalFamily || null,
    family_confidence: file.familyConfidence || "",
    family_status: file.familyStatus || "",
    family_reasons: Array.isArray(file.familyReasons) ? file.familyReasons : [],
    name_version: file.nameVersion || null,
    size_version: file.sizeVersion || null,
    detected_version: file.detectedVersion || null,
    rule_profile: file.ruleProfile || "",
    world_code: file.worldCode || "",
    world_name: file.worldName || "",
    world_confidence: file.worldConfidence || "",
    world_status: file.worldStatus || "",
    world_reasons: Array.isArray(file.worldReasons) ? file.worldReasons : [],
    initial_piece: file.originalPiece || file.piece || "",
    final_piece: file.piece || "",
    initial_family_id: family?.familyId || file.familyId || null,
    initial_family_key: family?.familyKey || file.familyKey || "",
    final_family_id: file.familyId || family?.familyId || null,
    final_family_key: file.familyKey || family?.familyKey || "",
    folder_group: folderGroup,
    manual_status: manualStatus,
    pending_reason: file.pendingReason || "",
    audit_payload: {
      source_name: file.file?.name || file.originalName || "",
      classification: file.familyClassification || null,
      worldCandidates: file.worldCandidates || [],
      duplicateResolved: Boolean(file.duplicateResolved),
      duplicateResolutionReason: file.duplicateResolutionReason || "",
    },
  }
}

async function createFallbackProcess(results, { batchName, downloadMode }) {
  const user = useUserStore.getState().user
  const firstItem = results[0] || {}
  const uniqueFamilies = new Set(results.map((item) => item.familyId))

  const { data, error } = await supabase
    .from("processes")
    .insert({
      total_files: results.length,
      total_families: uniqueFamilies.size,
      country: firstItem.country || "",
      campaign: firstItem.campaign || "",
      app_user_id: user?.id || null,
      app_user_name: user?.name || "anonimo",
      batch_name: batchName.trim() || null,
      download_mode: downloadMode || null,
      status: "download",
      current_stage: "download",
      rule_profile: firstItem.ruleProfile || "generic",
      rules_version:
        getRuleProfileVersion(firstItem.ruleProfile) ||
        CYBER_NOMENCLATURE_RULES_VERSION,
    })
    .select("id")
    .single()

  if (error) throw new Error("Error creando proceso")

  return data.id
}

async function uploadProcessZip(processId, batchName, zipBlob) {
  const safeBatchName = sanitizeStorageSegment(batchName || "tanda")
  const storagePath = `${processId}/${safeBatchName}.zip`

  const { error } = await supabase.storage
    .from("process-downloads")
    .upload(storagePath, zipBlob, {
      contentType: "application/zip",
      upsert: true,
    })

  if (error) throw new Error("Error subiendo ZIP del proceso")

  return storagePath
}

function sanitizeStorageSegment(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function isSupabaseConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}
