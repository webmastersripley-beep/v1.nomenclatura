import { buildFinalName } from "@/utils/buildFinalName"

export async function fakeAiProcessor(families, config) {

  await new Promise((resolve) =>
    setTimeout(resolve, 1500)
  )

  const results = families.flatMap((family) => {

    const detectedCategory = "calefaccion"

    return family.files.map((file) => {

      const baseResult = {
        piece:
          file.piece || "manual",

        format:
          file.format || "manual",

        campaign:
          config.campaign,

        category:
          detectedCategory,

        brand:
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

        originalName:
          file.originalName || "sin-nombre.webp",

        previewUrl:
          file.previewUrl || "",

        file:
          file.file,

        ...baseResult,

        finalName,

        status: "detected",
      }
    })
  })

  return results
}
