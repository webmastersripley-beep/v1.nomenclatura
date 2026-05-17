export function downloadMetadata(results) {

  const metadata = results.map((item) => ({

    originalName: item.originalName,

    finalName: item.finalName,

    piece: item.piece,

    format: item.format,

    campaign: item.campaign,

    category: item.category,

    country: item.country,

    date: item.date,

    brand: item.brand || "",

    tags: Array.isArray(item.tags)
      ? item.tags
      : [],
  }))

  const json =
    JSON.stringify(
      metadata,
      null,
      2
    )

  const blob =
    new Blob(
      [json],
      {
        type: "application/json",
      }
    )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement("a")

  link.href = url

  link.download =
    `metadata-${getTodayFormatted()}.json`

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
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