import { detectExactSize } from "./classifyImageFamily.js"
import {
  getDefaultPieceForFamily,
  versionToFormat,
} from "./imageFamilyRules.js"

export function detectBySize(width, height) {
  const match = detectExactSize(Number(width), Number(height))

  if (!match || match.ambiguous) {
    return null
  }

  return {
    component: getDefaultPieceForFamily(match.family),
    family: match.family,
    format: versionToFormat(match.version),
    version: match.version,
    detectedBySize: true,
  }
}
