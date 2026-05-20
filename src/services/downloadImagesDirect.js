import JSZip from "jszip"
import { saveAs } from "file-saver"

export async function downloadImagesDirect(results) {
  const downloadableItems = results.filter((item) => item.file)

  if (downloadableItems.length === 0) {
    return { count: 0, mode: "empty" }
  }

  if (supportsDirectoryPicker()) {
    const directoryHandle = await window.showDirectoryPicker({
      id: "nomenclaturas",
      mode: "readwrite",
      startIn: "downloads",
    })

    for (const [index, item] of downloadableItems.entries()) {
      const fileName = getSafeFileName(item, index)
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true,
      })
      const writable = await fileHandle.createWritable()

      await writable.write(item.file)
      await writable.close()
    }

    return { count: downloadableItems.length, mode: "folder" }
  }

  await downloadFlatZip(downloadableItems)

  return { count: downloadableItems.length, mode: "zip-fallback" }
}

function supportsDirectoryPicker() {
  return (
    typeof window !== "undefined" &&
    typeof window.showDirectoryPicker === "function"
  )
}

function getSafeFileName(item, index) {
  return sanitizeFileName(
    item.finalName || item.originalName || `imagen-${index + 1}.webp`
  )
}

async function downloadFlatZip(items) {
  const zip = new JSZip()

  items.forEach((item, index) => {
    zip.file(getSafeFileName(item, index), item.file)
  })

  const content = await zip.generateAsync({
    type: "blob",
  })

  saveAs(content, `nomenclaturas-directo-${getTodayFormatted()}.zip`)
}

function getTodayFormatted() {
  const today = new Date()

  const day = String(today.getDate()).padStart(2, "0")
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const year = String(today.getFullYear()).slice(-2)

  return `${day}${month}${year}`
}

function sanitizeFileName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
