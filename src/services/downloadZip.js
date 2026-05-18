import JSZip from "jszip"
import { saveAs } from "file-saver"

import { useUserStore }
  from "@/store/useUserStore"

export async function downloadZip(
  results
) {

  const preferences =
    useUserStore.getState()
      .preferences

  const downloadMode =
    preferences.download_mode
    || "por-familia"

  const zip = new JSZip()

  results.forEach((item) => {

    if (!item.file) {
      return
    }

    const fileName =
      sanitizeFileName(
        item.finalName
      )

    if (
      downloadMode === "directo"
    ) {

      zip.file(
        fileName,
        item.file
      )

      return
    }

    if (
      downloadMode ===
      "carpeta-unica"
    ) {

      zip
        .folder("imagenes")
        .file(
          fileName,
          item.file
        )

      return
    }

    if (
      downloadMode ===
      "por-formato"
    ) {

      const formatFolder =
        sanitizeFolderName(
          item.format ||
          "otros"
        )

      zip
        .folder(formatFolder)
        .file(
          fileName,
          item.file
        )

      return
    }

    const familyFolder =
      sanitizeFolderName(
        item.piece ||
        "manual"
      )

    zip
      .folder(familyFolder)
      .file(
        fileName,
        item.file
      )
  })

  const content =
    await zip.generateAsync({
      type: "blob",
    })

  const date =
    getTodayFormatted()

  saveAs(
    content,
    `nomenclaturas-${date}.zip`
  )
}

function sanitizeFileName(
  name
) {

  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\s+/g, "-")
    .replace(/ñ/g, "n")
}

function sanitizeFolderName(
  name
) {

  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(/\s+/g, "-")
    .replace(/ñ/g, "n")
}

function getTodayFormatted() {

  const today =
    new Date()

  const day =
    String(
      today.getDate()
    ).padStart(2, "0")

  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0")

  const year =
    String(
      today.getFullYear()
    ).slice(-2)

  return `${day}${month}${year}`
}