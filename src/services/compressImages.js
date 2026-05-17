import imageCompression from "browser-image-compression"

export async function compressHeavyImages(results) {
  const compressedResults = await Promise.all(
    results.map(async (item) => {
      if (!item.file || item.file.size < 200 * 1024) {
        return item
      }

      const compressedFile = await imageCompression(item.file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 2800,
        useWebWorker: true,
        fileType: item.file.type || "image/webp",
      })

      return {
        ...item,
        file: compressedFile,
        compressed: true,
        originalSize: item.file.size,
        compressedSize: compressedFile.size,
      }
    })
  )

  return compressedResults
} 