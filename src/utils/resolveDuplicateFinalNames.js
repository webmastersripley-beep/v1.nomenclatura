import { buildFinalName } from "./buildFinalName.js"
import { sanitizeValue } from "./sanitizeValue.js"

const GENERIC_DESCRIPTORS = new Set([
  "tecnologia",
  "tech",
  "electro",
  "electrohogar",
  "general",
  "manual",
])

const DESCRIPTOR_RULES = [
  {
    descriptor: "telefonia",
    terms: [
      "smartphone",
      "smartphones",
      "celular",
      "celulares",
      "telefono",
      "telefonia",
      "iphone",
      "android",
      "galaxy",
      "xiaomi",
      "motorola",
    ],
  },
  {
    descriptor: "computacion",
    terms: [
      "computacion",
      "notebook",
      "notebooks",
      "laptop",
      "laptops",
      "pc",
      "amd",
      "ryzen",
      "intel",
      "macbook",
      "lenovo",
      "asus",
      "hp",
      "dell",
    ],
  },
  {
    descriptor: "gaming",
    terms: [
      "gaming",
      "gamer",
      "playstation",
      "ps5",
      "xbox",
      "nintendo",
      "switch",
    ],
  },
  {
    descriptor: "audio",
    terms: [
      "audio",
      "audifonos",
      "parlante",
      "parlantes",
      "soundbar",
      "bluetooth",
      "jbl",
      "sony",
    ],
  },
  {
    descriptor: "tv",
    terms: [
      "televisor",
      "televisores",
      "tv",
      "smart-tv",
      "oled",
      "qled",
      "led",
    ],
  },
  {
    descriptor: "linea-blanca",
    terms: [
      "refrigerador",
      "lavadora",
      "secadora",
      "cocina",
      "lavavajillas",
      "freezer",
      "linea-blanca",
    ],
  },
]

export function resolveDuplicateFinalNames(results = []) {
  const nameMap = buildNameMap(results)
  let nextResults = results

  Object.values(nameMap).forEach((items) => {
    if (items.length < 2) return

    const resolvedItems = resolveDuplicateGroup(items)

    if (resolvedItems.length === 0) return

    const resolvedById = new Map(
      resolvedItems.map((item) => [item.id, item])
    )

    nextResults = nextResults.map((item) =>
      resolvedById.get(item.id) || item
    )
  })

  return nextResults
}

export function suggestSpecificDescriptor(item, usedDescriptors = new Set()) {
  const currentCategory = sanitizeValue(item?.category || "")
  const signalText = buildSignalText(item)

  for (const rule of DESCRIPTOR_RULES) {
    if (usedDescriptors.has(rule.descriptor)) continue
    if (currentCategory === rule.descriptor) continue

    const matched = rule.terms.some((term) =>
      signalText.includes(sanitizeValue(term))
    )

    if (matched) return rule.descriptor
  }

  const product = sanitizeValue(item?.product || "")

  if (product && !usedDescriptors.has(product)) {
    return product
  }

  const usefulTag = (item?.tags || [])
    .map((tag) => sanitizeValue(tag))
    .find((tag) =>
      tag &&
      !usedDescriptors.has(tag) &&
      !GENERIC_DESCRIPTORS.has(tag) &&
      tag !== "oferta" &&
      tag !== "descuento"
    )

  return usefulTag || ""
}

function resolveDuplicateGroup(items) {
  const usedDescriptors = new Set(
    items
      .map((item) => sanitizeValue(item.category || ""))
      .filter((category) => category && !GENERIC_DESCRIPTORS.has(category))
  )
  const resolved = []

  items.forEach((item) => {
    const currentCategory = sanitizeValue(item.category || "")

    if (currentCategory && !GENERIC_DESCRIPTORS.has(currentCategory)) {
      usedDescriptors.add(currentCategory)
      return
    }

    const nextCategory = suggestSpecificDescriptor(item, usedDescriptors)

    if (!nextCategory) return

    usedDescriptors.add(nextCategory)

    const updatedItem = {
      ...item,
      category: nextCategory,
      duplicateResolved: true,
      duplicateResolutionReason: `categoria ajustada desde ${currentCategory || "vacia"} por tags/producto`,
    }

    updatedItem.finalName = buildFinalName(
      updatedItem,
      updatedItem.descriptorMode || "category"
    )

    resolved.push(updatedItem)
  })

  return resolved
}

function buildNameMap(results) {
  return results.reduce((map, item) => {
    if (!item.finalName) return map

    if (!map[item.finalName]) {
      map[item.finalName] = []
    }

    map[item.finalName].push(item)
    return map
  }, {})
}

function buildSignalText(item) {
  return [
    item?.category,
    item?.brand,
    item?.product,
    ...(Array.isArray(item?.tags) ? item.tags : []),
    item?.originalName,
  ]
    .map((value) => sanitizeValue(value || ""))
    .filter(Boolean)
    .join(" ")
}
