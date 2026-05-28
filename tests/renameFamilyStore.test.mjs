import assert from "node:assert/strict"

if (!globalThis.crypto) {
  const { webcrypto } = await import("node:crypto")
  globalThis.crypto = webcrypto
}

const { useNomenclaturaStore } = await import("../src/store/useNomenclaturaStore.js")

const store = useNomenclaturaStore

store.getState().resetProject()
store.getState().setFamilies([
  {
    familyId: "family-1",
    familyKey: "bx-grupo-1",
    basePiece: "bx",
    groupNumber: 1,
    piece: "bx",
    folderGroup: "boxs",
    files: [
      {
        originalName: "box_aux_desk_1x.webp",
        piece: "bx",
        format: "desk",
        familyId: "family-1",
        familyKey: "bx-grupo-1",
        finalFamily: "BOX",
      },
    ],
  },
])

store.getState().renameFamily("family-1", "aux1")

const renamedFamily = store.getState().families[0]

assert.equal(renamedFamily.piece, "aux1")
assert.equal(renamedFamily.basePiece, "aux")
assert.equal(renamedFamily.folderGroup, "box-auxiliares")
assert.equal(renamedFamily.files[0].piece, "aux1")
assert.equal(renamedFamily.files[0].folderGroup, "box-auxiliares")
assert.equal(renamedFamily.files[0].manualPieceOverride, true)

store.getState().setResults([
  {
    id: "result-1",
    familyId: "family-1",
    originalName: "bx-desk.webp",
    piece: "bx",
    format: "desk",
    campaign: "prueba",
    category: "calzado",
    date: "270526",
    country: "cl",
    descriptorMode: "category",
    finalName: "bx-desk-prueba-calzado-270526-cl.webp",
  },
])

store.getState().renameResultFamily("family-1", "marca1")

const renamedResult = store.getState().results[0]

assert.equal(renamedResult.piece, "marca1")
assert.equal(renamedResult.folderGroup, "marcas")
assert.equal(
  renamedResult.finalName,
  "marca1-desk-prueba-calzado-270526-cl.webp"
)
assert.equal(renamedResult.manualPieceOverride, true)

store.getState().updateResultPatch("result-1", {
  piece: "mte-bx1",
  finalFamily: "MUNDO_BOX",
  componentFamily: "BOX",
  isWorldFamily: true,
  folderGroup: "boxs",
  zipFolder: "tecno/boxs",
  category: "mundo tecno",
})

const protectedResult = store.getState().results[0]

assert.equal(protectedResult.piece, "marca1")
assert.equal(protectedResult.finalFamily, undefined)
assert.equal(protectedResult.componentFamily, undefined)
assert.equal(protectedResult.isWorldFamily, undefined)
assert.equal(protectedResult.folderGroup, "marcas")
assert.equal(protectedResult.zipFolder, undefined)
assert.equal(protectedResult.category, "mundo-tecno")

console.log("rename family store ok")
