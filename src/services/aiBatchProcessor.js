import { analyzeImageWithGemini } from "@/services/geminiService"
import { buildFinalName } from "@/utils/buildFinalName"
import { getFolderForPiece } from "@/utils/cyberNomenclatureRules"
import { resolveDuplicateFinalNames } from "@/utils/resolveDuplicateFinalNames"
import { sanitizeTags, sanitizeValue } from "@/utils/sanitizeValue"
import {
  buildWorldPiece,
  getWorldFamilyForComponentFamily,
  getWorldZipFolder,
  isWorldFamily,
  resolveWorldFromSignals,
} from "@/utils/worldRules"

const DEFAULT_CONCURRENCY = 4
const MAX_RETRIES = 2
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])

export async function processFamiliesWithAi(
  families,
  config,
  {
    concurrency = DEFAULT_CONCURRENCY,
    onProgress,
  } = {}
) {
  const familyJobs = buildFamilyJobs(families, config)
  const total = familyJobs.length
  let completed = 0
  let failed = 0

  onProgress?.({
    total,
    completed,
    failed,
    active: 0,
    items: familyJobs.map((job) => ({
      id: job.id,
      originalName: job.label,
      status: "pending",
      attempts: 0,
    })),
  })

  const progressItems = new Map(
    familyJobs.map((job) => [
      job.id,
      {
        id: job.id,
        originalName: job.label,
        status: "pending",
        attempts: 0,
      },
    ])
  )

  const updateItemProgress = (id, patch) => {
    const current = progressItems.get(id)

    if (!current) return

    progressItems.set(id, {
      ...current,
      ...patch,
    })

    onProgress?.({
      total,
      completed,
      failed,
      active: [...progressItems.values()].filter(
        (item) => item.status === "analyzing" || item.status === "retrying"
      ).length,
      items: [...progressItems.values()],
    })
  }

  const processed = await runWithConcurrency(
    familyJobs,
    Math.max(1, concurrency),
    async (job) => {
      if (!job.representative?.file) {
        completed += 1
        updateItemProgress(job.id, {
          status: "done",
          attempts: 0,
        })
        return job.items
      }

      try {
        updateItemProgress(job.id, {
          status: "analyzing",
          attempts: 1,
        })

        const result = await analyzeWithRetry(job.representative.file, (attempt) => {
          updateItemProgress(job.id, {
            status: "retrying",
            attempts: attempt,
          })
        })

        completed += 1
        updateItemProgress(job.id, {
          status: "done",
        })

        return job.items.map((item) => applyAiResult(item, result))
      } catch (error) {
        console.error("Error IA:", job.label, error)

        completed += 1
        failed += 1
        updateItemProgress(job.id, {
          status: "error",
          error: error.message || "Error IA",
        })

        return job.items.map((item) => ({
          ...item,
          status: "review",
          aiError: error.message || "Error IA",
        }))
      }
    }
  )

  return resolveDuplicateFinalNames(processed.flat())
}

function buildFamilyJobs(families, config) {
  return families.map((family) => {
    const items = family.files.map((file) => buildBaseResult(family, file, config))
    const representative =
      items.find((item) => item.format === "desk" && item.file) ||
      items.find((item) => item.file) ||
      items[0] ||
      null

    return {
      id: family.familyId || crypto.randomUUID(),
      label: representative?.originalName || family.piece || "familia",
      representative,
      items,
    }
  })
}

function buildBaseResult(family, file, config) {
  const baseResult = {
    id: crypto.randomUUID(),
    familyId: family.familyId,
    originalPiece: family.originalPiece,
    folderGroup:
      file.folderGroup ||
      family.folderGroup ||
      getFolderForPiece(file.piece || family.piece, file.finalFamily),
    originalName: file.originalName || "sin-nombre.webp",
    previewUrl: file.previewUrl || "",
    file: file.file,
    width: file.width || null,
    height: file.height || null,
    dimension: file.dimension || (
      file.width && file.height ? `${file.width}x${file.height}` : ""
    ),
    ratio: file.ratio || null,
    nameFamily: file.nameFamily || null,
    sizeFamily: file.sizeFamily || null,
    finalFamily: file.finalFamily || null,
    familyConfidence: file.familyConfidence || "",
    familyStatus: file.familyStatus || "",
    familyReasons: file.familyReasons || [],
    nameVersion: file.nameVersion || null,
    sizeVersion: file.sizeVersion || null,
    detectedVersion: file.detectedVersion || null,
    ruleProfile: file.ruleProfile || config.ruleProfile || "generic",
    worldMode: Boolean(file.worldMode || config.worldMode),
    componentFamily: file.componentFamily || null,
    isWorldFamily: Boolean(file.isWorldFamily || isWorldFamily(file.finalFamily)),
    worldCode: file.worldCode || "",
    worldName: file.worldName || "",
    worldFolder: file.worldFolder || "",
    worldConfidence: file.worldConfidence || "",
    worldStatus: file.worldStatus || "",
    worldReasons: file.worldReasons || [],
    familyClassification: file.familyClassification || null,
    piece: file.piece || family.piece || "manual",
    format: file.format || file.detectedFormat || "manual",
    campaign: config.campaign,
    category: "",
    brand: "",
    product: "",
    tags: [],
    date: config.date,
    country: config.country,
    descriptorMode: config.descriptorMode || "category",
    status: "pending",
  }

  return {
    ...baseResult,
    finalName: buildFinalName(
      {
        ...baseResult,
        category: baseResult.category || "manual",
      },
      baseResult.descriptorMode
    ),
  }
}

async function analyzeWithRetry(file, onRetry) {
  let lastError = null

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt += 1) {
    try {
      return await analyzeImageWithGemini(file)
    } catch (error) {
      lastError = error

      if (
        attempt > MAX_RETRIES ||
        !RETRYABLE_STATUSES.has(Number(error.status))
      ) {
        throw error
      }

      const nextAttempt = attempt + 1
      onRetry?.(nextAttempt)
      await wait(900 * nextAttempt)
    }
  }

  throw lastError
}

function applyAiResult(item, result) {
  const category = sanitizeValue(result?.category || "")
  const brand = sanitizeValue(result?.brand || "")
  const product = sanitizeValue(result?.product || "")
  const tags = sanitizeTags(result?.tags || [])
  const worldPatch = resolveWorldPatch(item, {
    ...result,
    category,
    brand,
    product,
    tags,
  })

  const updatedItem = {
    ...item,
    category,
    brand,
    product,
    tags,
    ...worldPatch,
    status: category && worldPatch.worldStatus !== "REVISION_MANUAL"
      ? "detected"
      : "review",
  }

  updatedItem.finalName = buildFinalName(
    {
      ...updatedItem,
      category: updatedItem.category || "manual",
    },
    updatedItem.descriptorMode
  )

  return updatedItem
}

function resolveWorldPatch(item, result) {
  const targetWorldFamily = getTargetWorldFamily(item)

  if (!targetWorldFamily) return {}

  const worldResult = resolveWorldFromSignals({
    world: result?.world,
    category: result?.category,
    product: result?.product,
    brand: result?.brand,
    tags: result?.tags,
    originalName: item.originalName,
  })

  const basePatch = {
    worldCode: worldResult.worldCode,
    worldName: worldResult.worldName,
    worldFolder: worldResult.worldFolder,
    worldConfidence: worldResult.worldConfidence,
    worldStatus: worldResult.worldStatus,
    worldReasons: worldResult.worldReasons,
    worldCandidates: worldResult.worldCandidates,
  }

  if (!worldResult.worldCode) return basePatch

  const worldPiece = buildWorldPiece({
    worldCode: worldResult.worldCode,
    worldFamily: targetWorldFamily,
    piece: item.piece,
  })
  const folderGroup =
    item.folderGroup ||
    getFolderForPiece(worldPiece, item.finalFamily)

  return {
    ...basePatch,
    finalFamily: targetWorldFamily,
    componentFamily: item.componentFamily || item.finalFamily,
    isWorldFamily: true,
    piece: worldPiece,
    folderGroup,
    zipFolder: getWorldZipFolder({
      worldCode: worldResult.worldCode,
      worldFolder: worldResult.worldFolder,
      folderGroup,
    }),
  }
}

function getTargetWorldFamily(item) {
  if (item.isWorldFamily || isWorldFamily(item.finalFamily)) {
    return item.finalFamily
  }

  if (item.ruleProfile !== "cyberday" || !item.worldMode) return ""

  return getWorldFamilyForComponentFamily(item.finalFamily)
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function runNext() {
    const currentIndex = nextIndex
    nextIndex += 1

    if (currentIndex >= items.length) return

    results[currentIndex] = await worker(items[currentIndex], currentIndex)
    await runNext()
  }

  const workers = Array.from(
    {
      length: Math.min(concurrency, items.length || 1),
    },
    () => runNext()
  )

  await Promise.all(workers)
  return results
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
