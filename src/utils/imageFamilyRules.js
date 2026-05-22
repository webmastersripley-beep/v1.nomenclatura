export const FAMILY_REVIEW_MANUAL = "REVISION_MANUAL"

export const IMAGE_FAMILY_RULES = [
  {
    family: "BOX_VENTA",
    defaultPiece: "bx-vta",
    aliases: ["vnt", "vta", "bx-vta", "bx-vnt", "box venta"],
    sizes: [
      { width: 1257, height: 401, version: "DESKTOP", evidence: 1 },
      { width: 1554, height: 600, version: "MOBILE", evidence: 14 },
    ],
  },
  {
    family: "SOLO_X_HOY",
    defaultPiece: "sxh",
    aliases: [
      "sxh",
      "solo x hoy",
      "solo por hoy",
      "ol",
      "olmob",
      "oferta limite",
      "oferta al limite",
    ],
    sizes: [
      { width: 1280, height: 689, version: "APP", evidence: 3 },
      { width: 1300, height: 700, version: "APP", evidence: 12 },
      { width: 1140, height: 450, version: "DESKTOP", evidence: 20 },
      { width: 578, height: 463, version: "DESKTOP", evidence: 14 },
      { width: 480, height: 315, version: "MOBILE", evidence: 14 },
    ],
  },
  {
    family: "SLIDER",
    defaultPiece: "sl",
    aliases: [
      "sl",
      "slider",
      "slide",
      "home banner",
      "t1",
      "t2",
      "t3",
      "t4",
      "t5",
      "t6",
      "t7",
      "t8",
    ],
    sizes: [
      { width: 1512, height: 485, version: "DESKTOP", evidence: 1 },
      { width: 2800, height: 952, version: "DESKTOP", evidence: 63 },
      { width: 5600, height: 1904, version: "DESKTOP", evidence: 2 },
      { width: 1150, height: 1150, version: "MOBILE", evidence: 57 },
      { width: 1534, height: 1534, version: "MOBILE", evidence: 2 },
      { width: 2300, height: 2300, version: "MOBILE", evidence: 2 },
    ],
  },
  {
    family: "BOX",
    defaultPiece: "bx",
    aliases: ["bx", "box", "boxes", "caja", "destacado"],
    sizes: [
      { width: 650, height: 400, version: "APP", evidence: 1 },
      { width: 1140, height: 450, version: "DESKTOP", evidence: 1 },
      { width: 1140, height: 800, version: "DESKTOP", evidence: 17 },
      { width: 570, height: 800, version: "DESKTOP", evidence: 20 },
      { width: 600, height: 900, version: "DESKTOP", evidence: 10 },
      { width: 1532, height: 2336, version: "MOBILE", evidence: 1 },
      { width: 1632, height: 822, version: "MOBILE", evidence: 29 },
      { width: 3264, height: 1644, version: "MOBILE", evidence: 1 },
      { width: 676, height: 733, version: "MOBILE", evidence: 2 },
      { width: 766, height: 1168, version: "MOBILE", evidence: 38 },
    ],
  },
  {
    family: "CINTILLO",
    defaultPiece: "cint",
    aliases: ["cint", "cintillo"],
    sizes: [
      { width: 2752, height: 1536, version: null, evidence: 1 },
      { width: 500, height: 500, version: "APP", evidence: 2 },
      { width: 2200, height: 160, version: "DESKTOP", evidence: 11 },
      { width: 2880, height: 360, version: "DESKTOP", evidence: 1 },
      { width: 492, height: 492, version: "DESKTOP", evidence: 2 },
      { width: 1064, height: 160, version: "MOBILE", evidence: 10 },
    ],
  },
  {
    family: "AUX",
    defaultPiece: "aux",
    aliases: ["aux", "box_aux", "box-aux"],
    sizes: [
      { width: 2800, height: 260, version: "DESKTOP", evidence: 7 },
      { width: 2800, height: 284, version: "DESKTOP", evidence: 1 },
      { width: 2800, height: 475, version: "DESKTOP", evidence: 1 },
      { width: 1000, height: 360, version: "MOBILE", evidence: 24 },
      { width: 800, height: 260, version: "MOBILE", evidence: 1 },
    ],
  },
  {
    family: "MARCA",
    defaultPiece: "marca",
    aliases: [
      "m1",
      "m2",
      "m3",
      "m4",
      "m5",
      "m6",
      "m7",
      "m8",
      "m9",
      "m10",
      "m11",
      "m12",
      "marca",
    ],
    sizes: [
      { width: 532, height: 532, version: "DESKTOP", evidence: 1 },
      { width: 532, height: 532, version: "MOBILE", evidence: 19 },
    ],
  },
  {
    family: "NUEVAS",
    defaultPiece: "new-in",
    aliases: [
      "new-in",
      "newin",
      "nuevas",
      "cup",
      "cup1",
      "cup2",
      "mund",
      "mund1",
      "mund2",
      "mund3",
      "mund4",
      "mund5",
    ],
    sizes: [
      { width: 650, height: 520, version: "APP", evidence: 7 },
      { width: 650, height: 600, version: "APP", evidence: 11 },
      { width: 1140, height: 571, version: "DESKTOP", evidence: 4 },
      { width: 1140, height: 577, version: "DESKTOP", evidence: 2 },
      { width: 1256, height: 400, version: "DESKTOP", evidence: 3 },
      { width: 1575, height: 813, version: "DESKTOP", evidence: 2 },
      { width: 2325, height: 445, version: "DESKTOP", evidence: 2 },
      { width: 2400, height: 696, version: "DESKTOP", evidence: 2 },
      { width: 546, height: 577, version: "DESKTOP", evidence: 2 },
      { width: 546, height: 699, version: "DESKTOP", evidence: 6 },
      { width: 600, height: 900, version: "DESKTOP", evidence: 2 },
      { width: 1134, height: 1512, version: "MOBILE", evidence: 1 },
      { width: 1200, height: 348, version: "MOBILE", evidence: 1 },
      { width: 1554, height: 326, version: "MOBILE", evidence: 19 },
      { width: 1575, height: 813, version: "MOBILE", evidence: 4 },
      { width: 650, height: 660, version: "MOBILE", evidence: 4 },
      { width: 650, height: 750, version: "MOBILE", evidence: 2 },
      { width: 764, height: 1013, version: "MOBILE", evidence: 1 },
      { width: 764, height: 700, version: "MOBILE", evidence: 1 },
      { width: 766, height: 698, version: "MOBILE", evidence: 2 },
      { width: 767, height: 779, version: "MOBILE", evidence: 34 },
    ],
  },
  {
    family: "HEADER",
    defaultPiece: "header",
    aliases: ["header"],
    sizes: [
      { width: 1512, height: 567, version: "DESKTOP", evidence: 1 },
      { width: 3024, height: 1014, version: "DESKTOP", evidence: 1 },
      { width: 3024, height: 1118, version: "DESKTOP", evidence: 1 },
      { width: 3024, height: 1134, version: "DESKTOP", evidence: 1 },
      { width: 3024, height: 814, version: "DESKTOP", evidence: 1 },
      { width: 1534, height: 1530, version: "MOBILE", evidence: 1 },
      { width: 767, height: 765, version: "MOBILE", evidence: 1 },
    ],
  },
  {
    family: "MAILING",
    defaultPiece: "mailing",
    aliases: ["mailing"],
    sizes: [
      { width: 960, height: 1211, version: "DESKTOP", evidence: 1 },
      { width: 960, height: 2834, version: "DESKTOP", evidence: 1 },
    ],
  },
]

export const VERSION_NAME_RULES = [
  {
    version: "DESKTOP",
    aliases: [/\bdesk\b/, /\bdesktop\b/, /\bdt\b/, /\bdes\b/],
    format: "desk",
  },
  {
    version: "MOBILE",
    aliases: [/\bmb\b/, /\bmob\b/, /\bmobile\b/],
    format: "mb",
  },
  {
    version: "APP",
    aliases: [/\bapp\b/],
    format: "app",
  },
]

export function getRuleByFamily(family) {
  return IMAGE_FAMILY_RULES.find((rule) => rule.family === family) || null
}

export function getDefaultPieceForFamily(family) {
  return getRuleByFamily(family)?.defaultPiece || null
}

export function versionToFormat(version) {
  return VERSION_NAME_RULES.find((rule) => rule.version === version)?.format || null
}

