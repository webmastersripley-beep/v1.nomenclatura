import { getFolderForPiece } from "./cyberNomenclatureRules.js"
import { getWorldZipFolder } from "./worldRules.js"

export function buildZipEntryPath(item, downloadMode = "por-familia") {
  const fileName = sanitizeZipSegment(item.finalName || "archivo.webp")

  if (downloadMode === "directo") {
    return fileName
  }

  if (downloadMode === "carpeta-unica") {
    return `imagenes/${fileName}`
  }

  if (downloadMode === "por-formato") {
    return `${sanitizeZipSegment(item.format || "otros")}/${fileName}`
  }

  const folderGroup =
    item.zipFolder ||
    (item.worldCode ? getWorldZipFolder(item) : "") ||
    item.folderGroup ||
    getFolderForPiece(item.piece || "", item.finalFamily || "")

  return `${sanitizeZipSegment(folderGroup || "manual")}/${fileName}`
}

export function buildZipManifest(results, downloadMode = "por-familia") {
  return results
    .filter((item) => item.file)
    .map((item) => ({
      item,
      path: buildZipEntryPath(item, downloadMode),
    }))
}

function sanitizeZipSegment(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9._/-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
