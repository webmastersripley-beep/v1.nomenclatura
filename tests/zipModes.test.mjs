import assert from "node:assert/strict"
import {
  buildZipEntryPath,
} from "../src/utils/buildZipEntries.js"

const sample = {
  finalName: "grupo-1-desk-cyb-calefaccion-170526-cl.webp",
  piece: "grupo 1",
  format: "desk",
}

assert.equal(
  buildZipEntryPath(sample, "directo"),
  "grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

assert.equal(
  buildZipEntryPath(sample, "carpeta-unica"),
  "imagenes/grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

assert.equal(
  buildZipEntryPath(sample, "por-familia"),
  "otros/grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

assert.equal(
  buildZipEntryPath(sample, "por-formato"),
  "desk/grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

assert.equal(
  buildZipEntryPath(
    {
      finalName: "bx13-desk-cyber-zapatos-220526-cl.webp",
      piece: "bx13",
      finalFamily: "BOX",
    },
    "por-familia"
  ),
  "boxs/bx13-desk-cyber-zapatos-220526-cl.webp"
)

assert.equal(
  buildZipEntryPath(
    {
      finalName: "aux1-desk-cyber-home-220526-cl.webp",
      piece: "aux1",
      finalFamily: "AUX",
    },
    "por-familia"
  ),
  "box-auxiliares/aux1-desk-cyber-home-220526-cl.webp"
)

assert.equal(
  buildZipEntryPath(
    {
      finalName: "marca1-mb-cyber-moda-220526-cl.webp",
      piece: "marca1",
      finalFamily: "MARCA",
    },
    "por-familia"
  ),
  "marcas/marca1-mb-cyber-moda-220526-cl.webp"
)

console.log("zip modes ok")
