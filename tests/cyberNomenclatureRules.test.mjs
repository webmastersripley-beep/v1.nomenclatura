import assert from "node:assert/strict"

import { parseFileName } from "../src/utils/parseFileName.js"
import {
  getFolderForPiece,
  normalizeCyberComponent,
} from "../src/utils/cyberNomenclatureRules.js"

function assertComponent(input, expected) {
  const result = normalizeCyberComponent(input)

  Object.entries(expected).forEach(([key, value]) => {
    assert.equal(
      result?.[key],
      value,
      `${input}: expected ${key} to be ${value}, got ${result?.[key]}`
    )
  })
}

assertComponent(
  "box_aux_desk_1x.webp",
  {
    family: "AUX",
    piece: "aux1",
    folderGroup: "box-auxiliares",
  }
)

assertComponent(
  "bx13-desk.webp",
  {
    family: "BOX",
    piece: "bx13",
    folderGroup: "boxs",
  }
)

assertComponent(
  "m1-mb.webp",
  {
    family: "MARCA",
    piece: "marca1",
    folderGroup: "marcas",
  }
)

assertComponent(
  "marca1-mb.webp",
  {
    family: "MARCA",
    piece: "marca1",
    folderGroup: "marcas",
  }
)

assert.equal(parseFileName("box_aux_desk_1x.webp").piece, "aux1")
assert.equal(parseFileName("m1-mb.webp").piece, "marca1")
assert.equal(getFolderForPiece("aux2", "AUX"), "box-auxiliares")

console.log("cyber nomenclature rules ok")
