export function validateResults(results) {
  const errors = []
  const finalNameMap = {}
  const familyFormatMap = {}

  results.forEach((item) => {
    const requiredFields = [
      "piece",
      "format",
      "campaign",
      "category",
      "date",
      "country",
    ]

    requiredFields.forEach((field) => {
      if (!item[field] || item[field].trim() === "") {
        errors.push({
          id: `${item.id}-${field}`,
          type: "empty_field",
          message: `${item.originalName}: falta completar ${field}`,
        })
      }
    })

    if (item.finalName) {
      if (!finalNameMap[item.finalName]) {
        finalNameMap[item.finalName] = []
      }

      finalNameMap[item.finalName].push(item.originalName)
    }

    const familyKey = item.familyId || item.piece || "sin-familia"

    if (!familyFormatMap[familyKey]) {
      familyFormatMap[familyKey] = {}
    }

    if (item.format) {
      if (!familyFormatMap[familyKey][item.format]) {
        familyFormatMap[familyKey][item.format] = []
      }

      familyFormatMap[familyKey][item.format].push(item.originalName)
    }

    const invalidCharacters = /[ñáéíóúü\s]/i

    if (invalidCharacters.test(item.finalName || "")) {
      errors.push({
        id: `${item.id}-invalid-characters`,
        type: "invalid_characters",
        message: `${item.finalName}: contiene espacios, tildes o caracteres no recomendados`,
      })
    }
  })

  Object.entries(finalNameMap).forEach(([finalName, originals]) => {
    if (originals.length > 1) {
      errors.push({
        id: finalName,
        type: "duplicate_name",
        message: `Nombre final duplicado: ${finalName}`,
      })
    }
  })

  Object.entries(familyFormatMap).forEach(([familyKey, formats]) => {
    Object.entries(formats).forEach(([format, originals]) => {
      if (originals.length > 1) {
        errors.push({
          id: `${familyKey}-${format}`,
          type: "duplicate_format",
          message: `Familia ${familyKey}: tiene formato repetido "${format}"`,
        })
      }
    })
  })

  return errors
}