import assert from "node:assert/strict"

import { validateWarnings } from "../src/utils/validateWarnings.js"
import { RULE_PROFILE_CYBERDAY } from "../src/utils/ruleProfiles.js"

const results = [
  {
    id: "sl-desk",
    familyId: "sl1",
    piece: "sl1",
    format: "desk",
    finalName: "sl1-desk-prueba-tecnologia-220526-cl.webp",
    category: "tecnologia",
    brand: "",
    descriptorMode: "category",
    file: {
      size: 250 * 1024,
    },
  },
  {
    id: "sl-mb",
    familyId: "sl1",
    piece: "sl1",
    format: "mb",
    finalName: "sl1-mb-prueba-tecnologia-220526-cl.webp",
    category: "tecnologia",
    brand: "",
    descriptorMode: "category",
    file: {
      size: 180 * 1024,
    },
  },
]

const warnings = validateWarnings(results)

assert.equal(
  warnings.some((warning) => warning.type === "empty-brand"),
  false
)
assert.equal(
  warnings.some((warning) => warning.message.includes("marca IA vacia")),
  false
)
assert.equal(
  warnings.some((warning) => warning.message.includes("app")),
  false
)
assert.equal(
  warnings.filter((warning) => warning.id === "heavy-files").length,
  1
)

const cyberDeskOnlyWarnings = validateWarnings([
  {
    id: "top1-desk",
    familyId: "top1",
    piece: "top1",
    format: "desk",
    finalName: "top1-desk-cyber-hogar-290526-cl.webp",
    category: "hogar",
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_CYBERDAY,
  },
])

assert.equal(
  cyberDeskOnlyWarnings.some((warning) => warning.message.includes("formatos")),
  false
)

const cyberMobileReplacesAppWarnings = validateWarnings([
  {
    id: "sl-desk",
    familyId: "sl",
    piece: "sl",
    format: "desk",
    finalName: "sl-desk-cyber-tecnologia-290526-cl.webp",
    category: "tecnologia",
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_CYBERDAY,
  },
  {
    id: "sl-mb",
    familyId: "sl",
    piece: "sl",
    format: "mb",
    finalName: "sl-mb-cyber-tecnologia-290526-cl.webp",
    category: "tecnologia",
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_CYBERDAY,
  },
])

assert.equal(
  cyberMobileReplacesAppWarnings.some((warning) => warning.message.includes("app")),
  false
)

const cyberExplicitAppWarnings = validateWarnings([
  {
    id: "ol-desk",
    familyId: "ol",
    piece: "ol",
    format: "desk",
    finalName: "ol-desk-cyber-tecnologia-290526-cl.webp",
    category: "tecnologia",
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_CYBERDAY,
  },
  {
    id: "ol-mb",
    familyId: "ol",
    piece: "ol",
    format: "mb",
    finalName: "ol-mb-cyber-tecnologia-290526-cl.webp",
    category: "tecnologia",
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_CYBERDAY,
  },
])

assert.equal(
  cyberExplicitAppWarnings.some((warning) => warning.message.includes("app")),
  true
)

const brandWarnings = validateWarnings([
  {
    ...results[0],
    descriptorMode: "brand-category",
  },
])

assert.equal(
  brandWarnings.some((warning) => warning.message.includes("marca IA vacia")),
  true
)

console.log("warning rules ok")
