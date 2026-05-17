import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Método no permitido",
    })
  }

  try {

    const {
      imageBase64,
      mimeType,
    } = req.body

    if (!imageBase64 || !mimeType) {

      return res.status(400).json({
        error: "Imagen inválida",
      })
    }

    const response =
      await ai.models.generateContent({

        model: "gemini-2.0-flash",

        contents: [

          {
            text:
              `
              Analiza esta imagen retail.

              Devuelve SOLO un JSON válido.

              Estructura:

              {
                "category": "",
                "brand": "",
                "product": "",
                "campaign": "",
                "tags": []
              }

              category:
              categoria general retail.

              brand:
              marca detectada.

              product:
              nombre resumido producto.

              campaign:
              tipo de campaña detectada.

              tags:
              palabras clave.
              `,
          },

          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      })

    const text =
      response.text
        .replaceAll("```json", "")
        .replaceAll("```", "")
        .trim()

    const parsed =
      JSON.parse(text)

    return res.status(200).json(parsed)

  } catch (error) {

    console.error(error)

    return res.status(500).json({

      error: "Error analizando imagen",

      detail: error.message,
    })
  }
}