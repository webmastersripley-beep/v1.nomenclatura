import assert from "node:assert/strict"

import { buildFinalName } from "../src/utils/buildFinalName.js"
import { resolveDuplicateFinalNames } from "../src/utils/resolveDuplicateFinalNames.js"

function makeItem(id, signals) {
  const item = {
    id,
    originalName: `${id}.webp`,
    piece: "sl1",
    format: "desk",
    campaign: "prueba",
    category: "tecnologia",
    brand: signals.brand || "",
    product: signals.product || "",
    tags: signals.tags || [],
    date: "220526",
    country: "cl",
    descriptorMode: "category",
  }

  return {
    ...item,
    finalName: buildFinalName(item, "category"),
  }
}

const resolved = resolveDuplicateFinalNames([
  makeItem("lenovo", {
    brand: "lenovo",
    tags: ["laptop", "computacion", "amd-ryzen"],
  }),
  makeItem("iphone", {
    product: "smartphone",
    tags: ["smartphone", "tecnologia"],
  }),
])

assert.equal(resolved[0].category, "computacion")
assert.equal(resolved[1].category, "telefonia")
assert.notEqual(resolved[0].finalName, resolved[1].finalName)
assert.equal(resolved[0].duplicateResolved, true)
assert.equal(resolved[1].duplicateResolved, true)

console.log("duplicate final names resolver ok")
