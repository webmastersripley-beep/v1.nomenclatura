import assert from "node:assert/strict"

import { validateWarnings } from "../src/utils/validateWarnings.js"

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
