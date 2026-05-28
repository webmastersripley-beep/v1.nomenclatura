export const CYBER_NOMENCLATURE_RULES_VERSION = "cyber-literal-2026-05-22"

export const COMPONENT_FOLDER_MAP = {
  SLIDER: "sliders",
  SOLO_X_HOY: "solo-x-hoy",
  BOX: "boxs",
  BOX_VENTA: "box-venta",
  CINTILLO: "cintillos",
  AUX: "box-auxiliares",
  AUX_GRANDE: "box-auxiliares",
  MARCA: "marcas",
  NUEVAS: "nuevas",
  TOP_VENTAS: "top-ventas",
  OFERTA_LIMITE: "oferta-limite",
  ULTIMAS_UNIDADES: "ultimas-unidades",
  MUNDO_BOX: "boxs",
  MUNDO_AUX: "box-auxiliares",
  MUNDO_MARCA: "marcas",
  REVISION_MANUAL: "manuales",
}

const COMPONENT_RULES = [
  {
    family: "MUNDO_BOX",
    canonicalPrefix: "mundo-bx",
    aliases: ["mundo-bx", "mte-bx", "mmu-bx", "mho-bx", "mde-bx", "minf-bx"],
  },
  {
    family: "MUNDO_AUX",
    canonicalPrefix: "mundo-aux",
    aliases: ["mundo-aux", "mte-aux", "mmu-aux", "mho-aux", "mde-aux", "minf-aux"],
  },
  {
    family: "MUNDO_MARCA",
    canonicalPrefix: "mundo-marc",
    aliases: ["mundo-marc", "mte-marc", "mmu-marc", "mho-marc", "mde-marc", "minf-marc"],
  },
  {
    family: "AUX_GRANDE",
    canonicalPrefix: "aux0a",
    aliases: ["aux0a", "auxoa", "aux-grande", "aux-alto", "box-aux-alto"],
  },
  {
    family: "TOP_VENTAS",
    canonicalPrefix: "top",
    aliases: ["top", "top-ventas", "top-venta"],
  },
  {
    family: "OFERTA_LIMITE",
    canonicalPrefix: "ol",
    aliases: ["ol", "oferta-limite", "oferta-al-limite"],
  },
  {
    family: "ULTIMAS_UNIDADES",
    canonicalPrefix: "uu",
    aliases: ["uu", "ultimas-unidades", "punta-precio", "apurate"],
  },
  {
    family: "AUX",
    canonicalPrefix: "aux",
    aliases: ["box-aux", "box_aux", "box aux", "aux", "auxiliar", "auxiliares"],
  },
  {
    family: "BOX_VENTA",
    canonicalPrefix: "vnt",
    aliases: ["bx-vta", "bx_vta", "1bx-vta", "2bx-vta", "vnt", "vta", "box-venta"],
  },
  {
    family: "BOX",
    canonicalPrefix: "bx",
    aliases: ["box", "boxes", "bx"],
  },
  {
    family: "MARCA",
    canonicalPrefix: "marca",
    aliases: ["marca", "marcas", "m"],
  },
  {
    family: "SLIDER",
    canonicalPrefix: "sl",
    aliases: ["slider", "slide", "sl", "t"],
  },
  {
    family: "SOLO_X_HOY",
    canonicalPrefix: "sxh",
    aliases: ["sxh", "solo-x-hoy", "solo-por-hoy", "oferta-limite", "ol", "olm"],
  },
  {
    family: "CINTILLO",
    canonicalPrefix: "cint",
    aliases: ["cintillo", "cint", "cin"],
  },
  {
    family: "NUEVAS",
    canonicalPrefix: "new-in",
    aliases: ["new-in", "newin", "cup", "mund", "mundo"],
  },
]

export function normalizeCyberComponent(input = "") {
  const cleanName = normalizeNomenclatureText(input)
  const segments = cleanName.split("-").filter(Boolean)

  for (const rule of COMPONENT_RULES) {
    const aliasMatch = findAliasMatch(cleanName, segments, rule)

    if (!aliasMatch) continue

    const index = findPieceIndex(cleanName, segments, rule, aliasMatch.index)
    const piece = buildCanonicalPiece(rule.canonicalPrefix, index)

    return {
      family: rule.family,
      piece,
      basePiece: rule.canonicalPrefix,
      canonicalPrefix: rule.canonicalPrefix,
      pieceIndex: index,
      folderGroup: getFolderForFamily(rule.family),
      matchedAlias: aliasMatch.alias,
    }
  }

  return null
}

export function getFolderForFamily(family) {
  return COMPONENT_FOLDER_MAP[family] || "otros"
}

export function getFolderForPiece(piece = "", family = "") {
  const normalizedPiece = normalizeNomenclatureText(piece)
  const component = normalizeCyberComponent(normalizedPiece)

  if (component?.folderGroup) return component.folderGroup

  if (family) return getFolderForFamily(family)

  return "otros"
}

export function isPlaceholderPiece(piece = "") {
  return /^grupo-\d+$/.test(normalizeNomenclatureText(piece))
}

export function normalizeNomenclatureText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\.(webp|png|jpg|jpeg)$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function findAliasMatch(cleanName, segments, rule) {
  const directPrefixMatch = matchPrefixWithIndex(cleanName, rule.canonicalPrefix)

  if (directPrefixMatch) {
    return {
      alias: rule.canonicalPrefix,
      index: directPrefixMatch.segmentIndex,
    }
  }

  const aliases = [...rule.aliases].sort((a, b) => b.length - a.length)

  for (const alias of aliases) {
    const cleanAlias = normalizeNomenclatureText(alias)
    const aliasSegments = cleanAlias.split("-").filter(Boolean)

    if (aliasSegments.length === 1) {
      const segmentIndex = segments.findIndex((segment) =>
        segment === cleanAlias ||
        segment.match(new RegExp(`^${escapeRegex(cleanAlias)}\\d+$`))
      )

      if (segmentIndex >= 0) {
        return {
          alias: cleanAlias,
          index: segmentIndex,
        }
      }
    }

    const aliasPattern = new RegExp(`(^|-)${escapeRegex(cleanAlias)}($|-)`)

    if (aliasPattern.test(cleanName)) {
      return {
        alias: cleanAlias,
        index: findAliasSegmentIndex(segments, aliasSegments),
      }
    }
  }

  return null
}

function findPieceIndex(cleanName, segments, rule, aliasIndex) {
  const directPrefixMatch = matchPrefixWithIndex(cleanName, rule.canonicalPrefix)

  if (directPrefixMatch?.index) return directPrefixMatch.index

  if (rule.family === "MARCA") {
    const shortMarca = cleanName.match(/(^|-)m(\d{1,2})($|-)/)

    if (shortMarca) return shortMarca[2]
  }

  for (const alias of rule.aliases) {
    const cleanAlias = normalizeNomenclatureText(alias)
    const aliasIndexMatch = cleanName.match(
      new RegExp(`(^|-)${escapeRegex(cleanAlias)}-?(\\d{1,2})x?($|-)`)
    )

    if (aliasIndexMatch) return aliasIndexMatch[2]
  }

  for (let index = Math.max(0, aliasIndex + 1); index < segments.length; index += 1) {
    const segment = segments[index]
    const match = segment.match(/^(\d{1,2})x?$/)

    if (match) return match[1]
  }

  return null
}

function matchPrefixWithIndex(cleanName, prefix) {
  const cleanPrefix = normalizeNomenclatureText(prefix)
  const match = cleanName.match(
    new RegExp(`(^|-)${escapeRegex(cleanPrefix)}(\\d{1,2})($|-)`)
  )

  if (!match) return null

  const beforeMatch = cleanName.slice(0, match.index)
  const segmentIndex = beforeMatch ? beforeMatch.split("-").filter(Boolean).length : 0

  return {
    index: match[2],
    segmentIndex,
  }
}

function buildCanonicalPiece(prefix, index) {
  if (!index) return prefix

  return `${prefix}${Number(index)}`
}

function findAliasSegmentIndex(segments, aliasSegments) {
  if (aliasSegments.length === 0) return 0

  for (let index = 0; index <= segments.length - aliasSegments.length; index += 1) {
    const slice = segments.slice(index, index + aliasSegments.length)

    if (slice.join("-") === aliasSegments.join("-")) return index
  }

  return 0
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
