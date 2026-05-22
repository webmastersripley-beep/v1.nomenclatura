const AI_API_BASE_URL = (import.meta.env.VITE_AI_API_URL || "").replace(/\/$/, "")
const MAX_AI_IMAGE_SIDE = 1400
const MAX_DIRECT_UPLOAD_SIZE = 1.5 * 1024 * 1024

export async function analyzeImageWithGemini(file) {
  const preparedImage = await prepareImageForAi(file)
  const cleanBase64 = preparedImage.base64.split(",")[1]

  const response = await fetch(`${AI_API_BASE_URL}/api/analyze-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageBase64: cleanBase64,
      mimeType: preparedImage.mimeType,
    }),
  })

  if (!response.ok) {
    let detail

    try {
      detail = await response.json()
    } catch {
      detail = {}
    }

    const error = new Error(
      detail?.detail ||
      detail?.error ||
      "Error analizando imagen"
    )

    error.status = response.status
    error.detail = detail

    throw error
  }

  return response.json()
}

async function prepareImageForAi(file) {
  if (file.size <= MAX_DIRECT_UPLOAD_SIZE) {
    return {
      base64: await convertToBase64(file),
      mimeType: file.type,
    }
  }

  try {
    return await resizeImageForAi(file)
  } catch (error) {
    console.warn("No se pudo optimizar imagen para IA, usando original.", error)

    return {
      base64: await convertToBase64(file),
      mimeType: file.type,
    }
  }
}

async function resizeImageForAi(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(
    1,
    MAX_AI_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height)
  )
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement("canvas")

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  context.drawImage(bitmap, 0, 0, width, height)

  bitmap.close?.()

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82)
  })

  if (!blob) {
    throw new Error("No se pudo generar imagen optimizada")
  }

  return {
    base64: await convertToBase64(blob),
    mimeType: "image/jpeg",
  }
}

function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}
