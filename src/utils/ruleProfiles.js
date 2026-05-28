import { IMAGE_FAMILY_RULES } from "./imageFamilyRules.js"
import { sanitizeValue } from "./sanitizeValue.js"

export const RULE_PROFILE_AUTO = "auto"
export const RULE_PROFILE_GENERIC = "generic"
export const RULE_PROFILE_CYBERDAY = "cyberday"

export const RULE_PROFILE_LABELS = {
  [RULE_PROFILE_AUTO]: "Auto",
  [RULE_PROFILE_GENERIC]: "Generico",
  [RULE_PROFILE_CYBERDAY]: "Cyberday",
}

export const CYBERDAY_RULES_VERSION = "cyberday-excel-2026-05-28"

export const CYBERDAY_IMAGE_FAMILY_RULES = [
  {
    family: "SLIDER",
    defaultPiece: "sl",
    aliases: ["sl", "slider", "slide"],
    sizes: [
      { width: 2800, height: 952, version: "DESKTOP", evidence: 100 },
      { width: 1150, height: 1150, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "AUX_GRANDE",
    defaultPiece: "aux0a",
    aliases: ["aux0a", "auxoa", "aux grande", "aux alto", "box aux alto"],
    sizes: [
      { width: 2831, height: 430.44, version: "DESKTOP", evidence: 100 },
      { width: 1000, height: 548, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "TOP_VENTAS",
    defaultPiece: "top",
    aliases: ["top", "top ventas", "top-ventas"],
    sizes: [
      { width: 570, height: 719, version: "DESKTOP", evidence: 100 },
    ],
  },
  {
    family: "SOLO_X_HOY",
    defaultPiece: "sxh",
    aliases: ["sxh", "solo x hoy", "solo por hoy", "bombazo"],
    sizes: [
      { width: 1140, height: 456, version: "DESKTOP", evidence: 100 },
    ],
  },
  {
    family: "OFERTA_LIMITE",
    defaultPiece: "ol",
    aliases: ["ol", "oferta limite", "oferta al limite"],
    sizes: [
      { width: 1300, height: 700, version: "APP", evidence: 100 },
      { width: 578, height: 463, version: "DESKTOP", evidence: 100 },
      { width: 480, height: 315, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "AUX",
    defaultPiece: "aux",
    aliases: ["aux", "auxiliar", "box aux", "box-aux"],
    sizes: [
      { width: 2800, height: 260, version: "DESKTOP", evidence: 100 },
      { width: 1000, height: 360, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "MARCA",
    defaultPiece: "marca",
    aliases: ["marca", "marcas", "m"],
    sizes: [
      { width: 281, height: 841, version: "DESKTOP", evidence: 100 },
      { width: 570, height: 832, version: "DESKTOP", evidence: 100 },
      { width: 1140, height: 802, version: "DESKTOP", evidence: 100 },
      { width: 1632, height: 936, version: "MOBILE", evidence: 100 },
      { width: 766, height: 539, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "BOX_VENTA",
    defaultPiece: "vnt",
    aliases: ["vnt", "vta", "box venta", "box-venta"],
    sizes: [
      { width: 1256, height: 400, version: "DESKTOP", evidence: 100 },
    ],
  },
  {
    family: "ULTIMAS_UNIDADES",
    defaultPiece: "uu",
    aliases: ["uu", "ultimas unidades", "punta precio", "apurate"],
    sizes: [
      { width: 570, height: 629, version: "DESKTOP", evidence: 100 },
    ],
  },
  {
    family: "BOX",
    defaultPiece: "bx",
    aliases: ["bx", "box", "boxes"],
    sizes: [
      { width: 570, height: 800, version: "DESKTOP", evidence: 90 },
      { width: 1140, height: 800, version: "DESKTOP", evidence: 90 },
      { width: 2369, height: 584, version: "DESKTOP", evidence: 90 },
      { width: 1140, height: 800, version: "MOBILE", evidence: 20 },
    ],
  },
  {
    family: "MUNDO_BOX",
    defaultPiece: "mundo-bx",
    aliases: [
      "mte-bx",
      "mmu-bx",
      "mho-bx",
      "mde-bx",
      "minf-bx",
      "mundo bx",
      "mundo box",
    ],
    isWorld: true,
    componentFamily: "BOX",
    sizes: [
      { width: 2335, height: 661, version: "DESKTOP", evidence: 100 },
      { width: 1036.53, height: 985.61, version: "MOBILE", evidence: 100 },
      { width: 570, height: 800, version: "DESKTOP", evidence: 80 },
      { width: 518.26, height: 727.39, version: "MOBILE", evidence: 100 },
      { width: 1153, height: 400, version: "DESKTOP", evidence: 100 },
      { width: 1142, height: 363.69, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "MUNDO_AUX",
    defaultPiece: "mundo-aux",
    aliases: [
      "mte-aux",
      "mmu-aux",
      "mho-aux",
      "mde-aux",
      "minf-aux",
      "mundo aux",
    ],
    isWorld: true,
    componentFamily: "AUX",
    sizes: [
      { width: 2252, height: 209.11, version: "DESKTOP", evidence: 100 },
      { width: 1100, height: 396, version: "MOBILE", evidence: 100 },
      { width: 2376, height: 340, version: "DESKTOP", evidence: 100 },
      { width: 1223, height: 390, version: "MOBILE", evidence: 100 },
    ],
  },
  {
    family: "MUNDO_MARCA",
    defaultPiece: "mundo-marc",
    aliases: [
      "mte-marc",
      "mmu-marc",
      "mho-marc",
      "mde-marc",
      "minf-marc",
      "mundo marca",
      "mundo marc",
    ],
    isWorld: true,
    componentFamily: "MARCA",
    sizes: [
      { width: 650, height: 407, version: "DESKTOP", evidence: 100 },
      { width: 432, height: 602, version: "MOBILE", evidence: 100 },
    ],
  },
]

export function resolveRuleProfile(profile = RULE_PROFILE_AUTO, campaign = "") {
  if (profile === RULE_PROFILE_GENERIC || profile === RULE_PROFILE_CYBERDAY) {
    return profile
  }

  return isCyberdayCampaign(campaign)
    ? RULE_PROFILE_CYBERDAY
    : RULE_PROFILE_GENERIC
}

export function isCyberdayCampaign(value = "") {
  const cleanValue = sanitizeValue(value)

  return (
    cleanValue === "cyb" ||
    cleanValue === "cyber" ||
    cleanValue === "cyberday" ||
    cleanValue.includes("cyber")
  )
}

export function getRulesForProfile(
  ruleProfile = RULE_PROFILE_GENERIC,
  {
    includeWorldRules = false,
  } = {}
) {
  const rules = ruleProfile === RULE_PROFILE_CYBERDAY
    ? CYBERDAY_IMAGE_FAMILY_RULES
    : IMAGE_FAMILY_RULES

  return includeWorldRules
    ? rules
    : rules.filter((rule) => !rule.isWorld)
}

export function getRuleProfileVersion(ruleProfile = RULE_PROFILE_GENERIC) {
  return ruleProfile === RULE_PROFILE_CYBERDAY
    ? CYBERDAY_RULES_VERSION
    : "generic-family-rules"
}

export function getRuleByFamilyForProfile(
  family,
  ruleProfile = RULE_PROFILE_GENERIC
) {
  return getRulesForProfile(
    ruleProfile,
    {
      includeWorldRules: true,
    }
  ).find((rule) => rule.family === family) || null
}

export function getDefaultPieceForProfile(
  family,
  ruleProfile = RULE_PROFILE_GENERIC
) {
  return getRuleByFamilyForProfile(family, ruleProfile)?.defaultPiece || null
}
