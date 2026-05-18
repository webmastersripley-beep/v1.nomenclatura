import JSZip from "jszip"
import { saveAs } from "file-saver"

import { useUserStore }
  from "@/store/useUserStore"
import {
  buildZipManifest,
} from "@/utils/buildZipEntries"

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

  buildZipManifest(
    results,
    downloadMode
  ).forEach(({ item, path }) => {
    zip.file(path, item.file)
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
