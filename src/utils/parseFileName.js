import { normalizeCyberComponent } from "./cyberNomenclatureRules.js"

export function parseFileName(fileName) {
  const lowerName = fileName.toLowerCase()

  let piece = null
  let format = null

  const cleanName = lowerName
    .replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .replaceAll("_", "-")
    .replace(/\s+/g, "-")

  const cyberComponent = normalizeCyberComponent(cleanName)

  if (cyberComponent?.piece) {
    piece = cyberComponent.piece
  }

  const patterns = [
    { regex: /(box)(\d+)/, transform: (m) => `bx${m[2]}` },
    { regex: /(bx)(\d+)/, transform: (m) => `bx${m[2]}` },
    { regex: /(sl)(\d+)/, transform: (m) => `sl${m[2]}` },
    { regex: /(ol)(\d+)/, transform: (m) => `ol${m[2]}` },
    { regex: /(aux)(\d+)/, transform: (m) => `aux${m[2]}` },
    { regex: /(sxh)(\d+)/, transform: (m) => `sxh${m[2]}` },
    { regex: /(vnt)(\d+)/, transform: (m) => `vnt${m[2]}` },
    { regex: /(marca)(\d+)/, transform: (m) => `marca${m[2]}` },
    { regex: /(land)(-[a-z]+)?/, transform: (m) => `land${m[2] || ""}` },
    { regex: /(cin)/, transform: () => "cin" },
    { regex: /(newin)/, transform: () => "newin" },
    { regex: /(pop-up)/, transform: () => "pop-up" },
    { regex: /^(\d+)/, transform: (m) => m[1] },
  ]

  if (!piece) {
    for (const pattern of patterns) {
      const match = cleanName.match(pattern.regex)

      if (match) {
        piece = pattern.transform(match)
        break
      }
    }
  }

  if (cleanName.includes("desktop") || cleanName.includes("desk")) {
    format = "desk"
  } else if (cleanName.includes("mobile") || cleanName.includes("mb")) {
    format = "mb"
  } else if (cleanName.includes("app")) {
    format = "app"
  }

  const dynamicPiece = detectDynamicPiece(cleanName)

  if (!piece && dynamicPiece) {
    piece = dynamicPiece
  }

  let version = 0

  const versionMatch = cleanName.match(/\((\d+)\)$/)

  if (versionMatch) {
    version = Number(versionMatch[1])
  }

  return {
    originalName: fileName,
    piece,
    format,
    version,
  }
}

function detectDynamicPiece(cleanName) {
  const stopWords = [
    "desktop",
    "desk",
    "mobile",
    "mb",
    "app",
    "banner",
    "home",
    "principal",
    "final",
    "nuevo",
    "ok",
    "copy",
    "copia",
    "version",
    "horizontal",
    "vertical",
    "resize",
    "resized",
  ]

  let normalized = cleanName

  normalized = normalized.replace(/\d{2,5}x\d{2,5}/g, "")
  normalized = normalized.replace(/\(\d+\)/g, "")
  normalized = normalized.replaceAll("_", "-")

  stopWords.forEach((word) => {
    normalized = normalized.replaceAll(word, "")
  })

  normalized = normalized
    .replace(/--+/g, "-")
    .replace(/^-/, "")
    .replace(/-$/, "")
    .trim()

  const tokens = normalized.split("-").filter(Boolean)

  if (tokens.length === 0) return null
  if (tokens.length === 1) return tokens[0]

  const semanticWords = [
    "muebles",
    "kids",
    "woman",
    "man",
    "hombre",
    "mujer",
    "tecno",
    "deco",
    "beauty",
    "belleza",
    "fashion",
    "moda",
    "lash",
    "idole",
    "box",
    "cintillo",
    "banderas",
    "burberry",
    "asus",
    "lancome",
  ]

  const firstToken = tokens[0]
  const semanticName = [firstToken]

  for (const token of tokens.slice(1, 4)) {
    if (semanticWords.includes(token)) {
      semanticName.push(token)
    }
  }

  return semanticName.join("-")
}
