import { sanitizeValue } from "./sanitizeValue.js"

export const WORLD_STATUS_DETECTED = "DETECTADO"
export const WORLD_STATUS_MANUAL = "REVISION_MANUAL"

export const WORLD_COMPONENT_MAP = {
  MUNDO_BOX: {
    basePiece: "bx",
    folderGroup: "boxs",
  },
  MUNDO_AUX: {
    basePiece: "aux",
    folderGroup: "box-auxiliares",
  },
  MUNDO_MARCA: {
    basePiece: "marc",
    folderGroup: "marcas",
  },
}

export const COMPONENT_TO_WORLD_FAMILY = {
  BOX: "MUNDO_BOX",
  AUX: "MUNDO_AUX",
  MARCA: "MUNDO_MARCA",
}

export const WORLD_RULES = [
  {
    code: "mte",
    name: "Tecno",
    folder: "tecno",
    terms: [
      "mte",
      "tecno",
      "mundo-electro",
      "electrodomesticos",
      "telefonia",
      "smartphone",
      "smartphones",
      "celular",
      "celulares",
      "computacion",
      "notebook",
      "laptop",
      "gaming",
      "tv",
      "televisor",
      "audio",
      "electro",
      "tecnologia",
    ],
  },
  {
    code: "mmu",
    name: "Mujer",
    folder: "mujer",
    terms: [
      "mmu",
      "mujer",
      "moda-mujer",
      "belleza",
      "maquillaje",
      "cartera",
      "vestido",
      "calzado-mujer",
      "zapato-mujer",
    ],
  },
  {
    code: "mho",
    name: "Hombre",
    folder: "hombre",
    terms: [
      "mho",
      "hombre",
      "moda-hombre",
      "camisa",
      "ropa-hombre",
      "zapatilla-hombre",
      "calzado-hombre",
    ],
  },
  {
    code: "mde",
    name: "Deporte",
    folder: "deporte",
    terms: [
      "mde",
      "deporte",
      "deportes",
      "running",
      "fitness",
      "outdoor",
      "futbol",
      "bicicleta",
      "entrenamiento",
    ],
  },
  {
    code: "minf",
    name: "Infantil",
    folder: "infantil",
    terms: [
      "minf",
      "juguete",
      "juguetes",
      "nino",
      "nina",
      "bebe",
      "infantil",
      "escolar",
      "kids",
    ],
  },
]

export function getWorldRuleByCode(code = "") {
  const cleanCode = sanitizeValue(code)

  return WORLD_RULES.find((rule) => rule.code === cleanCode) || null
}

export function getWorldComponent(family = "") {
  return WORLD_COMPONENT_MAP[family] || null
}

export function isWorldFamily(family = "") {
  return Boolean(getWorldComponent(family))
}

export function getWorldFamilyForComponentFamily(family = "") {
  return COMPONENT_TO_WORLD_FAMILY[family] || ""
}

export function resolveWorldFromSignals(signals = {}) {
  const signalText = buildWorldSignalText(signals)
  const scores = WORLD_RULES.map((rule) => {
    const matchedTerms = rule.terms
      .map((term) => sanitizeValue(term))
      .filter((term) => signalText.includes(term))

    return {
      ...rule,
      score: matchedTerms.length,
      matchedTerms,
    }
  })
    .filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scores.length === 0) {
    return {
      worldCode: "",
      worldName: "",
      worldFolder: "",
      worldConfidence: "BAJA",
      worldStatus: WORLD_STATUS_MANUAL,
      worldReasons: ["sin senales suficientes para mundo"],
      worldCandidates: [],
    }
  }

  const best = scores[0]
  const second = scores[1]

  if (second && second.score === best.score) {
    return {
      worldCode: "",
      worldName: "",
      worldFolder: "",
      worldConfidence: "BAJA",
      worldStatus: WORLD_STATUS_MANUAL,
      worldReasons: [
        `mundo ambiguo: ${best.name} vs ${second.name}`,
      ],
      worldCandidates: scores.map(toWorldCandidate),
    }
  }

  return {
    worldCode: best.code,
    worldName: best.name,
    worldFolder: best.folder,
    worldConfidence: best.score >= 2 ? "ALTA" : "MEDIA",
    worldStatus: WORLD_STATUS_DETECTED,
    worldReasons: [
      `mundo ${best.name} por ${best.matchedTerms.join(", ")}`,
    ],
    worldCandidates: scores.map(toWorldCandidate),
  }
}

export function buildWorldPiece({
  worldCode,
  worldFamily,
  piece,
  pieceIndex,
} = {}) {
  const component = getWorldComponent(worldFamily)
  const cleanWorldCode = sanitizeValue(worldCode)

  if (!cleanWorldCode || !component) return sanitizeValue(piece || "")

  const index =
    pieceIndex ||
    sanitizeValue(piece || "").match(/(\d{1,2})$/)?.[1] ||
    "1"

  return `${cleanWorldCode}-${component.basePiece}${Number(index)}`
}

export function getWorldZipFolder({
  worldCode,
  worldFolder,
  folderGroup,
} = {}) {
  const resolvedWorld =
    worldFolder ||
    getWorldRuleByCode(worldCode)?.folder ||
    ""

  if (!resolvedWorld) return folderGroup || ""

  return `${resolvedWorld}/${folderGroup || "otros"}`
}

function buildWorldSignalText(signals = {}) {
  return [
    signals.world,
    signals.category,
    signals.product,
    signals.brand,
    signals.originalName,
    ...(Array.isArray(signals.tags) ? signals.tags : []),
  ]
    .map((value) => sanitizeValue(value || ""))
    .filter(Boolean)
    .join(" ")
}

function toWorldCandidate(rule) {
  return {
    code: rule.code,
    name: rule.name,
    score: rule.score,
    matchedTerms: rule.matchedTerms,
  }
}
