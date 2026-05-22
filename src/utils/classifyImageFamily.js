import {
  FAMILY_REVIEW_MANUAL,
  IMAGE_FAMILY_RULES,
  VERSION_NAME_RULES,
  getDefaultPieceForFamily,
  versionToFormat,
} from "./imageFamilyRules.js"

const RATIO_TOLERANCE = 0.03
const RATIO_TIE_TOLERANCE = 0.005

export function classifyImageFamily({
  fileName = "",
  width,
  height,
} = {}) {
  const normalizedName = normalizeName(fileName)
  const cleanWidth = Number(width) || null
  const cleanHeight = Number(height) || null
  const ratio = cleanWidth && cleanHeight
    ? roundRatio(cleanWidth / cleanHeight)
    : null

  const nameFamily = detectFamilyByName(normalizedName)
  const nameVersion = detectVersionByName(normalizedName)
  const exactSizeMatch = detectExactSize(
    cleanWidth,
    cleanHeight,
    {
      nameFamily,
      nameVersion,
    }
  )
  const ratioMatch = exactSizeMatch
    ? null
    : detectByRatio(
        cleanWidth,
        cleanHeight,
        {
          nameFamily,
          nameVersion,
        }
      )

  const sizeFamily = exactSizeMatch?.family || ratioMatch?.family || null
  const sizeVersion = exactSizeMatch?.version || null
  const reasons = []

  if (nameFamily) {
    reasons.push(`nombre apunta a ${nameFamily}`)
  } else {
    reasons.push("nombre sin familia clara")
  }

  if (exactSizeMatch?.ambiguous) {
    reasons.push(
      `tamano ${cleanWidth}x${cleanHeight} ambiguo: ${exactSizeMatch.candidates.join(", ")}`
    )
  } else if (exactSizeMatch) {
    reasons.push(
      `tamano ${cleanWidth}x${cleanHeight} coincide con ${exactSizeMatch.family} ${exactSizeMatch.version || ""}`.trim()
    )
  } else if (ratioMatch) {
    reasons.push(`proporcion ${ratio} se parece a ${ratioMatch.family}`)
  } else if (cleanWidth && cleanHeight) {
    reasons.push(`tamano ${cleanWidth}x${cleanHeight} sin regla conocida`)
  }

  if (nameVersion) {
    reasons.push(`nombre indica version ${nameVersion}`)
  }

  if (!cleanWidth || !cleanHeight) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily: null,
      finalFamily: FAMILY_REVIEW_MANUAL,
      nameVersion,
      sizeVersion: null,
      version: nameVersion || null,
      confidence: "REVISION_MANUAL",
      status: "ERROR_READING_IMAGE",
      reasons: [
        ...reasons,
        "no se pudieron leer las dimensiones reales de la imagen",
      ],
    })
  }

  if (!nameFamily && exactSizeMatch?.ambiguous) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily: exactSizeMatch.candidates.join(" | "),
      finalFamily: FAMILY_REVIEW_MANUAL,
      nameVersion,
      sizeVersion: null,
      version: nameVersion || null,
      confidence: "REVISION_MANUAL",
      status: "REVISION_MANUAL",
      reasons: [
        ...reasons,
        "el tamano coincide con mas de una familia y el nombre no decide",
      ],
    })
  }

  if (nameFamily && exactSizeMatch && nameFamily !== exactSizeMatch.family) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: FAMILY_REVIEW_MANUAL,
      nameVersion,
      sizeVersion,
      version: nameVersion || sizeVersion,
      confidence: "REVISION_MANUAL",
      status: "INCONSISTENCIA_NOMBRE_TAMANO",
      reasons: [
        ...reasons,
        `conflicto: nombre ${nameFamily} vs tamano ${exactSizeMatch.family}`,
      ],
    })
  }

  if (
    nameVersion &&
    exactSizeMatch?.version &&
    nameVersion !== exactSizeMatch.version
  ) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: FAMILY_REVIEW_MANUAL,
      nameVersion,
      sizeVersion,
      version: nameVersion,
      confidence: "REVISION_MANUAL",
      status: "INCONSISTENCIA_NOMBRE_TAMANO",
      reasons: [
        ...reasons,
        `conflicto: nombre ${nameVersion} vs tamano ${exactSizeMatch.version}`,
      ],
    })
  }

  if (nameFamily && exactSizeMatch && nameFamily === exactSizeMatch.family) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: nameFamily,
      nameVersion,
      sizeVersion,
      version: nameVersion || sizeVersion,
      confidence: "ALTA",
      status: "OK",
      reasons,
    })
  }

  if (!nameFamily && exactSizeMatch) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: exactSizeMatch.family,
      nameVersion,
      sizeVersion,
      version: sizeVersion,
      confidence: "MEDIA",
      status: "PREDICCION_POR_TAMANO",
      reasons,
    })
  }

  if (nameFamily && !exactSizeMatch) {
    const version = nameVersion || ratioMatch?.version || null

    if (ratioMatch && ratioMatch.family !== nameFamily) {
      return buildResult({
        fileName,
        width: cleanWidth,
        height: cleanHeight,
        ratio,
        nameFamily,
        sizeFamily,
        finalFamily: nameFamily,
        nameVersion,
        sizeVersion,
        version,
        confidence: "BAJA",
        status: "OK",
        reasons: [
          ...reasons,
          `se conserva ${nameFamily} porque la proporcion no es una regla exacta`,
        ],
      })
    }

    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: nameFamily,
      nameVersion,
      sizeVersion,
      version,
      confidence: "MEDIA",
      status: "OK",
      reasons,
    })
  }

  if (!nameFamily && ratioMatch) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      finalFamily: ratioMatch.family,
      nameVersion,
      sizeVersion,
      version: ratioMatch.version,
      confidence: "BAJA",
      status: "PREDICCION_POR_TAMANO",
      reasons,
    })
  }

  return buildResult({
    fileName,
    width: cleanWidth,
    height: cleanHeight,
    ratio,
    nameFamily,
    sizeFamily,
    finalFamily: FAMILY_REVIEW_MANUAL,
    nameVersion,
    sizeVersion,
    version: nameVersion || null,
    confidence: "REVISION_MANUAL",
    status: "REVISION_MANUAL",
    reasons: [
      ...reasons,
      "no hay evidencia suficiente para clasificar con seguridad",
    ],
  })
}

export function detectFamilyByName(normalizedName) {
  const cleanName = normalizeName(normalizedName)
  const matches = []

  for (const rule of IMAGE_FAMILY_RULES) {
    for (const alias of rule.aliases) {
      if (matchesAlias(cleanName, alias)) {
        matches.push({
          family: rule.family,
          alias: normalizeName(alias),
        })
      }
    }
  }

  if (matches.length === 0) return null

  matches.sort((a, b) => b.alias.length - a.alias.length)

  return matches[0].family
}

export function detectVersionByName(normalizedName) {
  const cleanName = normalizeName(normalizedName)

  for (const rule of VERSION_NAME_RULES) {
    if (rule.aliases.some((regex) => regex.test(cleanName))) {
      return rule.version
    }
  }

  return null
}

export function detectExactSize(width, height, context = {}) {
  if (!width || !height) return null

  return selectBestSizeCandidate(
    getExactSizeCandidates(width, height),
    context
  )
}

export function getExactSizeCandidates(width, height) {
  if (!width || !height) return []

  return IMAGE_FAMILY_RULES.flatMap((rule) =>
    rule.sizes
      .filter((candidate) => candidate.width === width && candidate.height === height)
      .map((size) => ({
        family: rule.family,
        version: size.version,
        width: size.width,
        height: size.height,
        ratio: roundRatio(size.width / size.height),
        evidence: Number(size.evidence || 0),
        exact: true,
      }))
  )
}

export function detectByRatio(width, height, context = {}) {
  if (!width || !height) return null

  const ratio = width / height
  const candidates = IMAGE_FAMILY_RULES.flatMap((rule) =>
    rule.sizes.map((size) => ({
      family: rule.family,
      version: size.version,
      width: size.width,
      height: size.height,
      ratio: size.width / size.height,
      evidence: Number(size.evidence || 0),
      diff: Math.abs(ratio - size.width / size.height),
    }))
  )
    .filter((candidate) => candidate.diff <= RATIO_TOLERANCE)
    .sort((a, b) => a.diff - b.diff)

  if (candidates.length === 0) return null

  const familyCandidates = context.nameFamily
    ? candidates.filter((candidate) => candidate.family === context.nameFamily)
    : candidates
  const scopedCandidates =
    familyCandidates.length > 0 ? familyCandidates : candidates
  const best = scopedCandidates[0]
  const competingCandidates = scopedCandidates.filter(
    (candidate) => candidate.diff - best.diff <= RATIO_TIE_TOLERANCE
  )
  const competingFamilies = new Set(
    competingCandidates.map((candidate) => candidate.family)
  )

  if (!context.nameFamily && competingFamilies.size > 1) return null

  const versionCandidates = context.nameVersion
    ? competingCandidates.filter(
        (candidate) => candidate.version === context.nameVersion
      )
    : []
  const resolvedBest = (versionCandidates.length > 0
    ? versionCandidates
    : competingCandidates
  ).sort((a, b) => (b.evidence || 0) - (a.evidence || 0))[0]

  return {
    family: resolvedBest.family,
    version: resolvedBest.version,
    width: resolvedBest.width,
    height: resolvedBest.height,
    ratio: roundRatio(resolvedBest.ratio),
    diff: roundRatio(resolvedBest.diff),
    exact: false,
  }
}

export function normalizeName(value = "") {
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

function selectBestSizeCandidate(candidates, context = {}) {
  if (candidates.length === 0) return null

  const { nameFamily, nameVersion } = context
  let scopedCandidates = candidates

  if (nameFamily) {
    const familyCandidates = candidates.filter(
      (candidate) => candidate.family === nameFamily
    )

    if (familyCandidates.length > 0) {
      scopedCandidates = familyCandidates
    }
  }

  if (nameVersion) {
    const versionCandidates = scopedCandidates.filter(
      (candidate) => candidate.version === nameVersion
    )

    if (versionCandidates.length > 0) {
      scopedCandidates = versionCandidates
    }
  }

  const families = new Set(scopedCandidates.map((candidate) => candidate.family))

  if (!nameFamily && families.size > 1) {
    return {
      ambiguous: true,
      candidates: [...families],
      exact: true,
    }
  }

  return [...scopedCandidates].sort(
    (a, b) => (b.evidence || 0) - (a.evidence || 0)
  )[0]
}

function matchesAlias(cleanName, alias) {
  const cleanAlias = normalizeName(alias)

  if (!cleanAlias) return false

  const escapedAlias = escapeRegex(cleanAlias)
  const segmentPattern = new RegExp(`(^|-)${escapedAlias}($|-)`)

  if (segmentPattern.test(cleanName)) return true

  const indexedAliasPattern = new RegExp(`(^|-)${escapedAlias}\\d+($|-)`)

  if (indexedAliasPattern.test(cleanName)) return true

  if (cleanAlias.startsWith("bx-v")) {
    const prefixedBoxVentaPattern = new RegExp(`(^|-)\\d*${escapedAlias}\\d*($|-)`)

    return prefixedBoxVentaPattern.test(cleanName)
  }

  return false
}

function buildResult({
  fileName,
  width,
  height,
  ratio,
  nameFamily,
  sizeFamily,
  finalFamily,
  nameVersion,
  sizeVersion,
  version,
  confidence,
  status,
  reasons,
}) {
  return {
    fileName,
    nameFamily,
    sizeFamily,
    finalFamily,
    defaultPiece: getDefaultPieceForFamily(finalFamily),
    version,
    format: versionToFormat(version),
    width,
    height,
    dimension: width && height ? `${width}x${height}` : "",
    ratio,
    confidence,
    status,
    reasons: dedupeReasons(reasons),
    nameVersion,
    sizeVersion,
  }
}

function roundRatio(value) {
  return Math.round(value * 1000) / 1000
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function dedupeReasons(reasons) {
  return [...new Set(reasons.filter(Boolean))]
}

