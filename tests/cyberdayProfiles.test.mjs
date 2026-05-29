import assert from "node:assert/strict"

import { classifyImageFamily } from "../src/utils/classifyImageFamily.js"
import {
  RULE_PROFILE_AUTO,
  RULE_PROFILE_CYBERDAY,
  RULE_PROFILE_GENERIC,
  resolveRuleProfile,
} from "../src/utils/ruleProfiles.js"
import {
  buildWorldPiece,
  normalizeWorldDescriptor,
  resolveWorldFromSignals,
} from "../src/utils/worldRules.js"
import { buildZipEntryPath } from "../src/utils/buildZipEntries.js"

assert.equal(resolveRuleProfile(RULE_PROFILE_AUTO, "cyb"), RULE_PROFILE_CYBERDAY)
assert.equal(resolveRuleProfile(RULE_PROFILE_AUTO, "hg"), RULE_PROFILE_GENERIC)

assert.equal(
  classifyImageFamily({
    fileName: "imagen.webp",
    width: 2800,
    height: 952,
    ruleProfile: RULE_PROFILE_CYBERDAY,
  }).finalFamily,
  "SLIDER"
)

const cyberIgnoresNameConflict = classifyImageFamily({
  fileName: "cint-desk-mal-nombrado.webp",
  width: 570,
  height: 800,
  ruleProfile: RULE_PROFILE_CYBERDAY,
})

assert.equal(cyberIgnoresNameConflict.nameFamily, null)
assert.equal(cyberIgnoresNameConflict.finalFamily, "BOX")
assert.equal(cyberIgnoresNameConflict.status, "PREDICCION_POR_TAMANO")

assert.equal(
  classifyImageFamily({
    fileName: "imagen.webp",
    width: 2831,
    height: 430,
    ruleProfile: RULE_PROFILE_CYBERDAY,
  }).finalFamily,
  "AUX_GRANDE"
)

assert.equal(
  classifyImageFamily({
    fileName: "top1-desk.webp",
    width: 570,
    height: 719,
    ruleProfile: RULE_PROFILE_CYBERDAY,
  }).finalFamily,
  "TOP_VENTAS"
)

assert.equal(
  classifyImageFamily({
    fileName: "mundo-electro/bx2-desk.png",
    width: 570,
    height: 800,
    ruleProfile: RULE_PROFILE_CYBERDAY,
    worldMode: true,
  }).finalFamily,
  "MUNDO_BOX"
)

assert.equal(
  classifyImageFamily({
    fileName: "mundo-electro/bx2-desk.png",
    width: 570,
    height: 800,
    ruleProfile: RULE_PROFILE_CYBERDAY,
    worldMode: false,
  }).finalFamily,
  "BOX"
)

assert.equal(
  classifyImageFamily({
    fileName: "aux1-desk.png",
    width: 2252,
    height: 209,
    ruleProfile: RULE_PROFILE_CYBERDAY,
    worldMode: true,
  }).finalFamily,
  "MUNDO_AUX"
)

assert.equal(
  classifyImageFamily({
    fileName: "mundo-electro/bx1-desk.png",
    width: 2356,
    height: 667,
    ruleProfile: RULE_PROFILE_CYBERDAY,
    worldMode: true,
  }).finalFamily,
  "MUNDO_BOX"
)

assert.equal(
  classifyImageFamily({
    fileName: "uu1-desk.webp",
    width: 570,
    height: 629,
    ruleProfile: RULE_PROFILE_CYBERDAY,
  }).finalFamily,
  "ULTIMAS_UNIDADES"
)

const mundoBox = classifyImageFamily({
  fileName: "imagen.webp",
  width: 2335,
  height: 661,
  ruleProfile: RULE_PROFILE_CYBERDAY,
  worldMode: true,
})

assert.equal(mundoBox.finalFamily, "MUNDO_BOX")
assert.equal(mundoBox.isWorldFamily, true)

assert.equal(
  resolveWorldFromSignals({
    category: "telefonia",
    tags: ["smartphone", "computacion"],
  }).worldCode,
  "mte"
)

assert.equal(
  resolveWorldFromSignals({
    category: "mundo tecno electro hogar",
    tags: ["hogar", "electrodomesticos"],
  }).worldCode,
  "mte"
)

assert.equal(
  normalizeWorldDescriptor("mundo tecno-electro-hogar", "mte"),
  "mundo-tecno"
)

assert.equal(
  normalizeWorldDescriptor("electrodomesticos", "mte"),
  "mundo-tecno"
)

assert.equal(
  resolveWorldFromSignals({
    category: "juguetes",
    tags: ["nino", "infantil"],
  }).worldCode,
  "minf"
)

assert.equal(
  resolveWorldFromSignals({
    category: "moda",
  }).worldStatus,
  "REVISION_MANUAL"
)

assert.equal(
  buildWorldPiece({
    worldCode: "mte",
    worldFamily: "MUNDO_BOX",
    piece: "mundo-bx1",
  }),
  "mte-bx1"
)

assert.equal(
  buildZipEntryPath({
    finalName: "mte-bx1-desk-cyb-telefonia-310526-cl.webp",
    piece: "mte-bx1",
    finalFamily: "MUNDO_BOX",
    folderGroup: "boxs",
    worldCode: "mte",
    worldFolder: "tecno",
  }),
  "tecno/boxs/mte-bx1-desk-cyb-telefonia-310526-cl.webp"
)

console.log("cyberday profile rules ok")
