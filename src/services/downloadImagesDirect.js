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

  downloadableItems.forEach((item, index) => {
    window.setTimeout(() => {
      saveAs(item.file, getSafeFileName(item, index))
    }, index * 120)
  })

  return { count: downloadableItems.length, mode: "multi-download" }
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

function sanitizeFileName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/-+/g, "-")
    .trim()
}
