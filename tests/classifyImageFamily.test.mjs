import assert from "node:assert/strict"

import { classifyImageFamily } from "../src/utils/classifyImageFamily.js"

function assertClassification(input, expected) {
  const result = classifyImageFamily(input)

  Object.entries(expected).forEach(([key, value]) => {
    assert.equal(
      result[key],
      value,
      `${input.fileName}: expected ${key} to be ${value}, got ${result[key]}`
    )
  })
}

assertClassification(
  {
    fileName: "sl1-desk-cyber.webp",
    width: 2800,
    height: 952,
  },
  {
    nameFamily: "SLIDER",
    sizeFamily: "SLIDER",
    finalFamily: "SLIDER",
    status: "OK",
    confidence: "ALTA",
    version: "DESKTOP",
  }
)

assertClassification(
  {
    fileName: "imagen-home-final.webp",
    width: 1150,
    height: 1150,
  },
  {
    nameFamily: null,
    sizeFamily: "SLIDER",
    finalFamily: "SLIDER",
    status: "PREDICCION_POR_TAMANO",
    confidence: "MEDIA",
    version: "MOBILE",
  }
)

assertClassification(
  {
    fileName: "cint-desk-cyber.webp",
    width: 532,
    height: 532,
  },
  {
    nameFamily: "CINTILLO",
    sizeFamily: "MARCA",
    finalFamily: "REVISION_MANUAL",
    status: "INCONSISTENCIA_NOMBRE_TAMANO",
    confidence: "REVISION_MANUAL",
  }
)

assertClassification(
  {
    fileName: "imagen-final.webp",
    width: 2200,
    height: 160,
  },
  {
    nameFamily: null,
    sizeFamily: "CINTILLO",
    finalFamily: "CINTILLO",
    status: "PREDICCION_POR_TAMANO",
    confidence: "MEDIA",
    version: "DESKTOP",
  }
)

assertClassification(
  {
    fileName: "imagen-generica.webp",
    width: 3264,
    height: 1644,
  },
  {
    nameFamily: null,
    sizeFamily: "BOX",
    finalFamily: "BOX",
    status: "PREDICCION_POR_TAMANO",
    confidence: "MEDIA",
    version: "MOBILE",
  }
)

assertClassification(
  {
    fileName: "m12-mb.webp",
    width: 532,
    height: 532,
  },
  {
    nameFamily: "MARCA",
    sizeFamily: "MARCA",
    finalFamily: "MARCA",
    status: "OK",
    confidence: "ALTA",
    nameVersion: "MOBILE",
    sizeVersion: "MOBILE",
    version: "MOBILE",
  }
)

assertClassification(
  {
    fileName: "1bx-vta-mb-rblack-flores-010426-cl.webp",
    width: 1554,
    height: 600,
  },
  {
    nameFamily: "BOX_VENTA",
    sizeFamily: "BOX_VENTA",
    finalFamily: "BOX_VENTA",
    status: "OK",
    confidence: "ALTA",
    version: "MOBILE",
  }
)

assertClassification(
  {
    fileName: "box-desk.webp",
    width: 1140,
    height: 450,
  },
  {
    nameFamily: "BOX",
    sizeFamily: "BOX",
    finalFamily: "BOX",
    status: "OK",
    confidence: "ALTA",
    version: "DESKTOP",
  }
)

assertClassification(
  {
    fileName: "imagen-final.webp",
    width: 1140,
    height: 450,
  },
  {
    nameFamily: null,
    sizeFamily: "SOLO_X_HOY | BOX",
    finalFamily: "REVISION_MANUAL",
    status: "REVISION_MANUAL",
    confidence: "REVISION_MANUAL",
  }
)

console.log("classification rules ok")
