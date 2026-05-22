import { GoogleGenAI } from "@google/genai"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
}

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
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no configurada",
      })
    }

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

        model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",

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
              categoria retail corta y especifica.
              Evita categorias demasiado generales si hay una pista mas clara.
              Por ejemplo:
              smartphone/celulares => telefonia
              laptop/notebook/pc => computacion
              playstation/xbox/nintendo => gaming
              audifonos/parlantes => audio
              televisor/smart tv => tv
              Usa tecnologia solo si no existe una categoria mas precisa.

              brand:
              marca detectada.

              product:
              nombre resumido producto, por ejemplo smartphone, notebook, tv, audifonos.

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
