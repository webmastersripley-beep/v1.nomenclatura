import {
  RULE_PROFILE_CYBERDAY,
  getCyberdayExpectedFormatsForPiece,
} from "./ruleProfiles.js"

const BRAND_DESCRIPTOR_MODES = new Set([
  "brand",
  "brand-category",
  "category-brand",
])

export function validateWarnings(results) {
  const warnings = []
  const families = {}
  const heavyFiles = []
  const largeDimensionFiles = []

  results.forEach((item) => {
    const familyKey = item.familyId || item.piece || "sin-familia"

    if (!families[familyKey]) {
      families[familyKey] = []
    }

    families[familyKey].push(item)

    if ((item.finalName || "").length > 80) {
      warnings.push({
        id: `${item.id}-long-name`,
        message: `${item.finalName}: nombre muy largo`,
      })
    }

    if (shouldWarnEmptyBrand(item)) {
      warnings.push({
        id: `${item.id}-empty-brand`,
        message: `${item.finalName}: marca IA vacia`,
      })
    }

    if (isGenericCategory(item.category)) {
      warnings.push({
        id: `${item.id}-generic-category`,
        message: `${item.finalName}: categoria generica o sin definir`,
      })
    }

    const fileSizeKb = item.file?.size
      ? Math.round(item.file.size / 1024)
      : 0

    if (fileSizeKb >= 200) {
      heavyFiles.push({
        name: item.originalName,
        sizeKb: fileSizeKb,
      })
    }

    if (item.width && item.height) {
      const totalPixels = item.width * item.height

      if (totalPixels > 4000000) {
        largeDimensionFiles.push({
          name: item.originalName,
          width: item.width,
          height: item.height,
        })
      }
    }
  })

  addAggregatedFileWarning(warnings, {
    id: "heavy-files",
    items: heavyFiles,
    buildMessage: (items) =>
      `${items.length} imagen(es) pesan mas de 200 KB. Puedes compactarlas antes de publicar. Ej: ${formatExamples(
        items.map((item) => `${item.name} ${item.sizeKb} KB`)
      )}`,
  })

  addAggregatedFileWarning(warnings, {
    id: "large-dimensions",
    items: largeDimensionFiles,
    buildMessage: (items) =>
      `${items.length} imagen(es) tienen resolucion alta. Puede convenir optimizarlas. Ej: ${formatExamples(
        items.map((item) => `${item.name} ${item.width}x${item.height}`)
      )}`,
  })

  Object.entries(families).forEach(([familyKey, items]) => {
    const formats = items
      .map((item) => item.format)
      .filter(Boolean)
    const expectedFormats = getExpectedFormats(items)
    const missingFormats = expectedFormats.filter(
      (format) => !formats.includes(format)
    )

    if (missingFormats.length > 0) {
      warnings.push({
        id: `${familyKey}-missing-formats`,
        message: `Familia ${getFamilyLabel(items, familyKey)}: faltan formatos ${missingFormats.join(", ")}`,
      })
    }
  })

  return warnings
}

function shouldWarnEmptyBrand(item) {
  const descriptorMode = item.descriptorMode || "category"

  return BRAND_DESCRIPTOR_MODES.has(descriptorMode) && !item.brand
}

function isGenericCategory(category) {
  return (
    !category ||
    category === "manual" ||
    category === "general"
  )
}

function getExpectedFormats(items) {
  if (items.some((item) => item.ruleProfile === RULE_PROFILE_CYBERDAY)) {
    const cyberFormats = getCyberdayExpectedFormats(items)

    if (cyberFormats) return cyberFormats

    return []
  }

  const formats = new Set(
    items
      .map((item) => item.format)
      .filter(Boolean)
  )
  const hasDesktopOrMobile =
    formats.has("desk") ||
    formats.has("mb")

  if (!hasDesktopOrMobile) return []

  return ["desk", "mb"]
}

function getCyberdayExpectedFormats(items) {
  const pieces = [
    ...new Set(
      items
        .map((item) => item.piece)
        .filter(Boolean)
    ),
  ]

  const expectedFormats = pieces
    .map((piece) => getCyberdayExpectedFormatsForPiece(piece))
    .filter((formats) => formats.length > 0)

  if (expectedFormats.length === 0) return null

  return [...new Set(expectedFormats.flat())]
}

function getFamilyLabel(items, fallback) {
  return items[0]?.piece || fallback
}

function addAggregatedFileWarning(warnings, { id, items, buildMessage }) {
  if (items.length === 0) return

  warnings.push({
    id,
    message: buildMessage(items),
  })
}

function formatExamples(examples) {
  return examples.slice(0, 3).join("; ")
}
