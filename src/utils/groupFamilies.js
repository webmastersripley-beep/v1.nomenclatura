import { FAMILY_REVIEW_MANUAL } from "./imageFamilyRules.js"
import { normalizeCyberComponent } from "./cyberNomenclatureRules.js"

export function groupFamilies(files) {

  const manualFiles = []

  /*
  ---------------------------------------------------
  NORMALIZAR FORMATO
  ---------------------------------------------------
  */

  const normalizedFiles =
    files.map((file) => {

      let detectedFormat =
        file.format

      /*
      ---------------------------------------------------
      SI NO TIENE FORMATO:
      detectar por tamaño
      ---------------------------------------------------
      */

      if (!detectedFormat) {

        if (
          file.width >= 2000
        ) {
          detectedFormat = "desk"
        }

        else if (
          file.width >= 900 &&
          file.height >= 900
        ) {
          detectedFormat = "mb"
        }

        else if (
          file.width <= 700 &&
          file.height <= 700
        ) {
          detectedFormat = "app"
        }
      }

      return {
        ...file,
        detectedFormat,
      }
    })

  /*
  ---------------------------------------------------
  ARCHIVOS SIN FORMATO
  → manuales
  ---------------------------------------------------
  */

  const validFiles = []

normalizedFiles.forEach((file) => {
  if (
    file.finalFamily === FAMILY_REVIEW_MANUAL ||
    file.familyStatus === "ERROR_READING_IMAGE" ||
    file.familyStatus === "INCONSISTENCIA_NOMBRE_TAMANO"
  ) {
    manualFiles.push({

      ...file,

      manualId:
        crypto.randomUUID(),

      pendingReason:
        file.familyStatus || "family_review_manual",
    })

    return
  }

  /*
  ---------------------------------------------------
  SI YA TIENE FORMATO:
  entra directo
  ---------------------------------------------------
  */

  if (file.detectedFormat) {

    validFiles.push(file)

    return
  }

  /*
  ---------------------------------------------------
  INTENTO DE INFERENCIA
  POR PIEZA EXISTENTE
  ---------------------------------------------------
  */

  if (file.piece) {

    const relatedFiles =
      normalizedFiles.filter(
        (candidate) =>
          candidate.piece ===
            file.piece &&
          candidate !== file &&
          candidate.detectedFormat
      )

    const usedFormats =
      relatedFiles.map(
        (candidate) =>
          candidate.detectedFormat
      )

    const allFormats = [
      "desk",
      "mb",
      "app",
    ]

    const missingFormats =
      allFormats.filter(
        (format) =>
          !usedFormats.includes(
            format
          )
      )

    /*
    ---------------------------------------------------
    SI SOLO FALTA 1 FORMATO:
    lo asignamos automáticamente
    ---------------------------------------------------
    */

    if (
      missingFormats.length === 1
    ) {

      validFiles.push({

        ...file,

        detectedFormat:
          missingFormats[0],

        inferred: true,
      })

      return
    }
  }

  /*
  ---------------------------------------------------
  SI NO SE PUDO INFERIR:
  manual
  ---------------------------------------------------
  */

  manualFiles.push({

    ...file,

    manualId:
      crypto.randomUUID(),

    pendingReason:
      "missing_format",
  })
})

  /*
  ---------------------------------------------------
  AGRUPACIÓN HÍBRIDA
  ---------------------------------------------------
  */

  const familiesMap = {}

  validFiles.forEach((file) => {

    /*
    ---------------------------------------------------
    NOMBRE BASE DE FAMILIA
    ---------------------------------------------------
    */

    const component =
      normalizeCyberComponent(file.piece || file.originalName) ||
      normalizeCyberComponent(file.familyClassification?.defaultPiece || "")

    const basePiece =
      component?.basePiece ||
      file.piece ||
      file.familyClassification?.defaultPiece ||
      "grupo"

    const displayPiece =
      component?.piece ||
      file.piece ||
      file.familyClassification?.defaultPiece ||
      basePiece

    /*
    ---------------------------------------------------
    BUSCAR GRUPOS EXISTENTES
    ---------------------------------------------------
    */

    const existingGroups =
      Object.values(
        familiesMap
      ).filter(
        (family) =>
          family.basePiece ===
          basePiece
      )

    /*
    ---------------------------------------------------
    BUSCAR GRUPO DISPONIBLE
    ---------------------------------------------------
    */

    let targetFamily =
      existingGroups.find(
        (family) => {

          const alreadyExists =
            family.files.some(
              (familyFile) =>
                familyFile.detectedFormat ===
                file.detectedFormat
            )

          return !alreadyExists
        }
      )

    /*
    ---------------------------------------------------
    SI NO EXISTE:
    crear nuevo grupo
    ---------------------------------------------------
    */

    if (!targetFamily) {

      const nextGroupNumber =
        existingGroups.length + 1

      const familyKey =
        `${basePiece}-grupo-${nextGroupNumber}`

      targetFamily = {

        familyId:
          crypto.randomUUID(),

        familyKey,

        basePiece,

        groupNumber:
          nextGroupNumber,

        piece:
          displayPiece,

        folderGroup:
          component?.folderGroup || null,

        files: [],
      }

      familiesMap[
        familyKey
      ] = targetFamily
    }

    targetFamily.files.push({

      ...file,

      familyId:
        targetFamily.familyId,

      familyKey:
        targetFamily.familyKey,

      format:
        file.detectedFormat,

      piece:
        displayPiece,

      folderGroup:
        component?.folderGroup || null,
    })
  })

  const families =
    Object.values(
      familiesMap
    )

  return {
    families,
    manualFiles,
  }
}
