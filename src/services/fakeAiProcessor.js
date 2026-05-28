import { buildFinalName } from "@/utils/buildFinalName"
import { getFolderForPiece } from "@/utils/cyberNomenclatureRules"
import { resolveDuplicateFinalNames } from "@/utils/resolveDuplicateFinalNames"
import { isWorldFamily } from "@/utils/worldRules"

export async function fakeAiProcessor(
  families,
  config,
  {
    onProgress,
  } = {}
) {
  const total = families.reduce(
    (accumulator, family) => accumulator + family.files.length,
    0
  )

  await new Promise((resolve) =>
    setTimeout(resolve, 250)
  )

  onProgress?.({
    total,
    completed: 0,
    failed: 0,
    active: 0,
    items: families.flatMap((family) =>
      family.files.map((file) => ({
        id: file.originalName,
        originalName: file.originalName,
        status: "pending",
        attempts: 0,
      }))
    ),
  })

  const results = families.flatMap((family) => {
    return family.files.map((file) => {

      const baseResult = {
        piece:
          file.piece || "manual",

        format:
          file.format || "manual",

        campaign:
          config.campaign,

        category:
          "manual",

        brand:
          "",

        product:
          "",

        date:
          config.date,

        country:
          config.country,

        descriptorMode:
          config.descriptorMode || "category",
      }

      const finalName =
        buildFinalName(
          baseResult,
          baseResult.descriptorMode
        )

      return {

        id: crypto.randomUUID(),

        familyId: family.familyId,
        originalPiece: family.originalPiece,
        folderGroup:
          file.folderGroup ||
          family.folderGroup ||
          getFolderForPiece(file.piece || family.piece, file.finalFamily),

        originalName:
          file.originalName || "sin-nombre.webp",

        previewUrl:
          file.previewUrl || "",

        file:
          file.file,

        width:
          file.width || null,

        height:
          file.height || null,

        dimension:
          file.dimension || (
            file.width && file.height
              ? `${file.width}x${file.height}`
              : ""
          ),

        ratio:
          file.ratio || null,

        nameFamily:
          file.nameFamily || null,

        sizeFamily:
          file.sizeFamily || null,

        finalFamily:
          file.finalFamily || null,

        familyConfidence:
          file.familyConfidence || "",

        familyStatus:
          file.familyStatus || "",

        familyReasons:
          file.familyReasons || [],

        nameVersion:
          file.nameVersion || null,

        sizeVersion:
          file.sizeVersion || null,

        detectedVersion:
          file.detectedVersion || null,

        ruleProfile:
          file.ruleProfile || config.ruleProfile || "generic",

        worldMode:
          Boolean(file.worldMode || config.worldMode),

        componentFamily:
          file.componentFamily || null,

        isWorldFamily:
          Boolean(file.isWorldFamily || isWorldFamily(file.finalFamily)),

        worldCode:
          file.worldCode || "",

        worldName:
          file.worldName || "",

        worldFolder:
          file.worldFolder || "",

        worldConfidence:
          file.worldConfidence || "",

        worldStatus:
          file.isWorldFamily || isWorldFamily(file.finalFamily)
            ? "REVISION_MANUAL"
            : "",

        worldReasons:
          file.isWorldFamily || isWorldFamily(file.finalFamily)
            ? ["IA desactivada; mundo requiere revision"]
            : [],

        familyClassification:
          file.familyClassification || null,

        ...baseResult,

        finalName,

        status:
          file.isWorldFamily || isWorldFamily(file.finalFamily)
            ? "review"
            : "detected",
      }
    })
  })

  onProgress?.({
    total,
    completed: total,
    failed: 0,
    active: 0,
    items: results.map((item) => ({
      id: item.id,
      originalName: item.originalName,
      status: "done",
      attempts: 0,
    })),
  })

  return resolveDuplicateFinalNames(results)
}
