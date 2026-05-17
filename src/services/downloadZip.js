import JSZip from "jszip"
import { saveAs } from "file-saver"

export async function downloadZip(results) {
  const zip = new JSZip()

  results.forEach((item) => {
    if (!item.file) return

    const folderName = sanitizeFolderName(
      item.piece || "manual"
    )

    const fileName = sanitizeFileName(
      item.finalName
    )

    zip.folder(folderName).file(
      fileName,
      item.file
    )
  })

  const content = await zip.generateAsync({
    type: "blob",
  })

  const date = getTodayFormatted()

  saveAs(
    content,
    `nomenclaturas-${date}.zip`
  )
}

function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/ñ/g, "n")
}

function sanitizeFolderName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/ñ/g, "n")
}

function getTodayFormatted() {
  const today = new Date()

  const day = String(today.getDate()).padStart(2, "0")
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const year = String(today.getFullYear()).slice(-2)

  return `${day}${month}${year}`
}