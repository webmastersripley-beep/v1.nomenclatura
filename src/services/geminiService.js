export async function analyzeImageWithGemini(file) {

  const base64 =
    await convertToBase64(file)

  const cleanBase64 =
    base64.split(",")[1]

  const response =
    await fetch("http://localhost:3001/api/analyze-image", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({

        imageBase64: cleanBase64,

        mimeType: file.type,
      }),
    })

  if (!response.ok) {

    throw new Error(
      "Error analizando imagen"
    )
  }

  return response.json()
}

function convertToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader =
      new FileReader()

    reader.readAsDataURL(file)

    reader.onload = () =>
      resolve(reader.result)

    reader.onerror = (error) =>
      reject(error)
  })
}