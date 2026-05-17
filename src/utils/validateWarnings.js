export function validateWarnings(results) {
  const warnings = []
  const families = {}

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

    if (!item.brand) {
      warnings.push({
        id: `${item.id}-empty-brand`,
        message: `${item.finalName}: marca IA vacía`,
      })
    }

    if (!Array.isArray(item.tags) || item.tags.length === 0) {
      warnings.push({
        id: `${item.id}-empty-tags`,
        message: `${item.finalName}: sin tags IA`,
      })
    }

    if (
      !item.category ||
      item.category === "manual" ||
      item.category === "general"
    ) {
      warnings.push({
        id: `${item.id}-generic-category`,
        message: `${item.finalName}: categoría genérica o sin definir`,
      })
    }
    const fileSizeKb = item.file?.size
        ? Math.round(item.file.size / 1024)
        : 0

        if (fileSizeKb >= 200) {
        warnings.push({
            id: `${item.id}-heavy-file`,
            message: `${item.originalName}: pesa ${fileSizeKb} KB. Se recomienda compactar antes de publicar.`,
        })
        }

        if (item.width && item.height) {
  const totalPixels = item.width * item.height

  if (totalPixels > 4000000) {
    warnings.push({
      id: `${item.id}-large-dimensions`,
      message: `${item.originalName}: resolución alta (${item.width}x${item.height}). Puede convenir optimizarla.`,
    })
  }
}
  })

  Object.entries(families).forEach(([familyKey, items]) => {
    const formats = items.map((item) => item.format)
    const expectedFormats = ["desk", "mb", "app"]
    const missingFormats = expectedFormats.filter(
      (format) => !formats.includes(format) 
    )

    if (missingFormats.length > 0) {
      warnings.push({
        id: `${familyKey}-missing-formats`,
        message: `Familia ${familyKey}: faltan formatos ${missingFormats.join(", ")}`,
      })
    }
  })

  return warnings
}