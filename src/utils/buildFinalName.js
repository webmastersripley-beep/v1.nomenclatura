import { sanitizeValue } from "./sanitizeValue.js"

export const DESCRIPTOR_MODES = [
  "category",
  "brand-category",
  "category-brand",
  "brand",
]

export function buildDescriptor({
  category,
  brand,
  descriptorMode = "category",
}) {
  const cleanCategory = sanitizeValue(category || "manual")
  const cleanBrand = sanitizeValue(brand || "")

  switch (descriptorMode) {
    case "brand-category":
      return [cleanBrand || "sin-marca", cleanCategory || "manual"].join("-")
    case "category-brand":
      return [cleanCategory || "manual", cleanBrand || "sin-marca"].join("-")
    case "brand":
      return cleanBrand || "sin-marca"
    case "category":
    default:
      return cleanCategory || "manual"
  }
}

export function buildFinalName(item, descriptorMode = "category") {
  const descriptor = buildDescriptor({
    category: item.category,
    brand: item.brand,
    descriptorMode,
  })

  return [
    sanitizeValue(item.piece || "manual"),
    sanitizeValue(item.format || "manual"),
    sanitizeValue(item.campaign || "hg"),
    descriptor,
    sanitizeValue(item.date || ""),
    sanitizeValue(item.country || "cl"),
  ]
    .filter(Boolean)
    .join("-") + ".webp"
}
