export async function fakeAiProcessor(families, config) {

  await new Promise((resolve) =>
    setTimeout(resolve, 1500)
  )

  const results = families.flatMap((family) => {

    const detectedCategory = "calefaccion"

    return family.files.map((file, index) => {

      const finalName =
        [
          file.piece || "manual",
          file.format || "manual",
          config.campaign,
          detectedCategory,
          config.date,
          config.country,
        ].join("-") + ".webp"

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

        piece:
          file.piece || "manual",

        format:
          file.format || "manual",

        campaign:
          config.campaign,

        category:
          detectedCategory,

        date:
          config.date,

        country:
          config.country,

        finalName,

        status: "detected",
      }
    })
  })

  return results
}