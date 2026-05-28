import {
  FAMILY_REVIEW_MANUAL,
  VERSION_NAME_RULES,
  versionToFormat,
} from "./imageFamilyRules.js"
import {
  RULE_PROFILE_CYBERDAY,
  RULE_PROFILE_GENERIC,
  getDefaultPieceForProfile,
  getRulesForProfile,
  resolveRuleProfile,
} from "./ruleProfiles.js"
import { isWorldFamily } from "./worldRules.js"

const RATIO_TOLERANCE = 0.03
const RATIO_TIE_TOLERANCE = 0.005
const CYBERDAY_SIZE_TOLERANCE = 2

export function classifyImageFamily({
  fileName = "",
  width,
  height,
  ruleProfile = RULE_PROFILE_GENERIC,
  campaign = "",
  worldMode = false,
} = {}) {
  const effectiveRuleProfile = resolveRuleProfile(ruleProfile, campaign)
  const normalizedName = normalizeName(fileName)
  const cleanWidth = Number(width) || null
  const cleanHeight = Number(height) || null
  const ratio = cleanWidth && cleanHeight
    ? roundRatio(cleanWidth / cleanHeight)
    : null

  const nameFamily = detectFamilyByName(
    normalizedName,
    effectiveRuleProfile,
    {
      includeWorldRules: worldMode,
    }
  )
  const nameVersion = detectVersionByName(normalizedName)
  const exactSizeMatch = detectExactSize(
    cleanWidth,
    cleanHeight,
    {
      nameFamily,
      nameVersion,
      ruleProfile: effectiveRuleProfile,
      includeWorldRules: worldMode,
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
          ruleProfile: effectiveRuleProfile,
          includeWorldRules: worldMode,
        }
      )

  const resolvedExactSizeMatch = resolveCyberdayWorldSizeMatch(
    exactSizeMatch,
    cleanWidth,
    cleanHeight,
    {
      nameFamily,
      nameVersion,
      normalizedName,
      ruleProfile: effectiveRuleProfile,
      includeWorldRules: worldMode,
    }
  )
  const resolvedNameFamily =
    resolvedExactSizeMatch?.isWorld && isWorldBaseFamily(nameFamily)
      ? resolvedExactSizeMatch.family
      : nameFamily

  const sizeFamily = resolvedExactSizeMatch?.family || ratioMatch?.family || null
  const sizeVersion = resolvedExactSizeMatch?.version || null
  const reasons = []

  if (nameFamily) {
    reasons.push(`nombre apunta a ${nameFamily}`)
  } else {
    reasons.push("nombre sin familia clara")
  }

  if (exactSizeMatch?.ambiguous && !resolvedExactSizeMatch?.isWorld) {
    reasons.push(
      `tamano ${cleanWidth}x${cleanHeight} ambiguo: ${exactSizeMatch.candidates.join(", ")}`
    )
  } else if (resolvedExactSizeMatch) {
    reasons.push(
      `tamano ${cleanWidth}x${cleanHeight} coincide con ${resolvedExactSizeMatch.family} ${resolvedExactSizeMatch.version || ""}`.trim()
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
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (!resolvedNameFamily && exactSizeMatch?.ambiguous && !resolvedExactSizeMatch?.isWorld) {
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
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (
    resolvedNameFamily &&
    resolvedExactSizeMatch &&
    resolvedNameFamily !== resolvedExactSizeMatch.family
  ) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily: resolvedNameFamily,
      sizeFamily,
      finalFamily: FAMILY_REVIEW_MANUAL,
      nameVersion,
      sizeVersion,
      version: nameVersion || sizeVersion,
      confidence: "REVISION_MANUAL",
      status: "INCONSISTENCIA_NOMBRE_TAMANO",
      reasons: [
        ...reasons,
        `conflicto: nombre ${resolvedNameFamily} vs tamano ${resolvedExactSizeMatch.family}`,
      ],
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (
    nameVersion &&
    resolvedExactSizeMatch?.version &&
    nameVersion !== resolvedExactSizeMatch.version
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
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (
    resolvedNameFamily &&
    resolvedExactSizeMatch &&
    resolvedNameFamily === resolvedExactSizeMatch.family
  ) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily: resolvedNameFamily,
      sizeFamily,
      exactSizeMatch: resolvedExactSizeMatch,
      finalFamily: resolvedNameFamily,
      nameVersion,
      sizeVersion,
      version: nameVersion || sizeVersion,
      confidence: "ALTA",
      status: "OK",
      reasons,
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (!resolvedNameFamily && resolvedExactSizeMatch) {
    return buildResult({
      fileName,
      width: cleanWidth,
      height: cleanHeight,
      ratio,
      nameFamily,
      sizeFamily,
      exactSizeMatch: resolvedExactSizeMatch,
      finalFamily: resolvedExactSizeMatch.family,
      nameVersion,
      sizeVersion,
      version: sizeVersion,
      confidence: "MEDIA",
      status: "PREDICCION_POR_TAMANO",
      reasons,
      ruleProfile: effectiveRuleProfile,
    })
  }

  if (nameFamily && !exactSizeMatch) {
    const version = nameVersion || ratioMatch?.version || null

    if (
      effectiveRuleProfile === RULE_PROFILE_CYBERDAY &&
      ratioMatch?.isWorld &&
      worldMode &&
      isWorldBaseFamily(nameFamily)
    ) {
      return buildResult({
        fileName,
        width: cleanWidth,
        height: cleanHeight,
        ratio,
        nameFamily: ratioMatch.family,
        sizeFamily,
        exactSizeMatch: ratioMatch,
        finalFamily: ratioMatch.family,
        nameVersion,
        sizeVersion,
        version,
        confidence: "BAJA",
        status: "PREDICCION_POR_TAMANO",
        reasons: [
          ...reasons,
          `perfil Cyberday prioriza ${ratioMatch.family} por proporcion de mundo`,
        ],
        ruleProfile: effectiveRuleProfile,
      })
    }

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
        ruleProfile: effectiveRuleProfile,
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
      ruleProfile: effectiveRuleProfile,
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
      exactSizeMatch: ratioMatch,
      finalFamily: ratioMatch.family,
      nameVersion,
      sizeVersion,
      version: ratioMatch.version,
      confidence: "BAJA",
      status: "PREDICCION_POR_TAMANO",
      reasons,
      ruleProfile: effectiveRuleProfile,
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
    ruleProfile: effectiveRuleProfile,
  })
}

export function detectFamilyByName(
  normalizedName,
  ruleProfile = RULE_PROFILE_GENERIC,
  {
    includeWorldRules = false,
  } = {}
) {
  const cleanName = normalizeName(normalizedName)
  const matches = []

  for (const rule of getRulesForProfile(ruleProfile, { includeWorldRules })) {
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
    getExactSizeCandidatesForProfile(
      width,
      height,
      context.ruleProfile || RULE_PROFILE_GENERIC
      ,
      {
        includeWorldRules: Boolean(context.includeWorldRules),
      }
    ),
    context
  )
}

export function getExactSizeCandidates(width, height) {
  return getExactSizeCandidatesForProfile(width, height, RULE_PROFILE_GENERIC)
}

export function getExactSizeCandidatesForProfile(
  width,
  height,
  ruleProfile = RULE_PROFILE_GENERIC
  ,
  {
    includeWorldRules = false,
  } = {}
) {
  if (!width || !height) return []

  const tolerance =
    ruleProfile === "cyberday" ? CYBERDAY_SIZE_TOLERANCE : 0

  return getRulesForProfile(ruleProfile, { includeWorldRules }).flatMap((rule) =>
    rule.sizes
      .filter((candidate) =>
        Math.abs(candidate.width - width) <= tolerance &&
        Math.abs(candidate.height - height) <= tolerance
      )
      .map((size) => ({
        family: rule.family,
        componentFamily: rule.componentFamily || null,
        isWorld: Boolean(rule.isWorld),
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

  const ruleProfile = context.ruleProfile || RULE_PROFILE_GENERIC
  const ratio = width / height
  const candidates = getRulesForProfile(
    ruleProfile,
    {
      includeWorldRules: Boolean(context.includeWorldRules),
    }
  ).flatMap((rule) =>
    rule.sizes.map((size) => ({
      family: rule.family,
      componentFamily: rule.componentFamily || null,
      isWorld: Boolean(rule.isWorld),
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
    componentFamily: resolvedBest.componentFamily,
    isWorld: resolvedBest.isWorld,
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

function resolveCyberdayWorldSizeMatch(match, width, height, context = {}) {
  if (
    context.ruleProfile !== RULE_PROFILE_CYBERDAY ||
    !context.includeWorldRules ||
    !width ||
    !height
  ) {
    return match
  }

  const worldCandidates = getExactSizeCandidatesForProfile(
    width,
    height,
    RULE_PROFILE_CYBERDAY,
    {
      includeWorldRules: true,
    }
  )
    .filter((candidate) => candidate.isWorld)

  if (worldCandidates.length === 0) return match

  const preferredVersionCandidates = context.nameVersion
    ? worldCandidates.filter((candidate) => candidate.version === context.nameVersion)
    : []
  const scopedCandidates =
    preferredVersionCandidates.length > 0
      ? preferredVersionCandidates
      : worldCandidates

  return [...scopedCandidates].sort(
    (a, b) => (b.evidence || 0) - (a.evidence || 0)
  )[0]
}

function isWorldBaseFamily(family) {
  return ["BOX", "AUX", "MARCA"].includes(family)
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
  exactSizeMatch,
  finalFamily,
  nameVersion,
  sizeVersion,
  version,
  confidence,
  status,
  reasons,
  ruleProfile,
}) {
  const componentFamily =
    exactSizeMatch?.componentFamily ||
    getRulesForProfile(
      ruleProfile,
      {
        includeWorldRules: true,
      }
    ).find((rule) => rule.family === finalFamily)
      ?.componentFamily ||
    null

  return {
    fileName,
    nameFamily,
    sizeFamily,
    finalFamily,
    componentFamily,
    isWorldFamily: isWorldFamily(finalFamily),
    defaultPiece: getDefaultPieceForProfile(finalFamily, ruleProfile),
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
    ruleProfile,
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
