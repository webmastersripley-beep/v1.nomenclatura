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
  "grupo-1/grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

assert.equal(
  buildZipEntryPath(sample, "por-formato"),
  "desk/grupo-1-desk-cyb-calefaccion-170526-cl.webp"
)

console.log("zip modes ok")
