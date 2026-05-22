const CSV_COLUMNS = [
  ["archivo", "originalName"],
  ["ancho", "width"],
  ["alto", "height"],
  ["dimension", "dimension"],
  ["proporcion", "ratio"],
  ["familia_nombre", "nameFamily"],
  ["familia_tamano", "sizeFamily"],
  ["familia_final", "finalFamily"],
  ["version", "detectedVersion"],
  ["confianza", "familyConfidence"],
  ["estado", "familyStatus"],
  ["motivos", "familyReasons"],
]

export function downloadClassificationReport(items = []) {
  const rows = normalizeReportItems(items)
  const csv = buildClassificationCsv(rows)
  const blob = new Blob(
    [csv],
    {
      type: "text/csv;charset=utf-8",
    }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = `reporte-clasificacion-${getTodayFormatted()}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

export function buildClassificationCsv(items = []) {
  const header = CSV_COLUMNS.map(([label]) => escapeCsv(label)).join(",")
  const rows = normalizeReportItems(items).map((item) =>
    CSV_COLUMNS
      .map(([, field]) => escapeCsv(resolveField(item, field)))
      .join(",")
  )

  return [header, ...rows].join("\n")
}

export function normalizeReportItems(items = []) {
  return items.map((item) => ({
    originalName:
      item.originalName || item.fileName || "",
    width:
      item.width || "",
    height:
      item.height || "",
    dimension:
      item.dimension || (
        item.width && item.height ? `${item.width}x${item.height}` : ""
      ),
    ratio:
      item.ratio || "",
    nameFamily:
      item.nameFamily || "",
    sizeFamily:
      item.sizeFamily || "",
    finalFamily:
      item.finalFamily || "",
    detectedVersion:
      item.detectedVersion || item.version || "",
    familyConfidence:
      item.familyConfidence || item.confidence || "",
    familyStatus:
      item.familyStatus || item.status || "",
    familyReasons:
      Array.isArray(item.familyReasons)
        ? item.familyReasons
        : item.reasons || [],
  }))
}

function resolveField(item, field) {
  const value = item[field]

  if (Array.isArray(value)) {
    return value.join(" | ")
  }

  return value ?? ""
}

function escapeCsv(value) {
  const stringValue = String(value ?? "")

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll("\"", "\"\"")}"`
  }

  return stringValue
}

function getTodayFormatted() {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, "0")
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const year = String(today.getFullYear()).slice(-2)

  return `${day}${month}${year}`
}
