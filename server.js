import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai"

dotenv.config()

const app = express()

app.use(cors())

app.use(
  express.json({
    limit: "20mb",
  })
)

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: "Imagen inválida",
      })
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",

      contents: [
        {
          text: `
            Analiza esta imagen retail.

            Devuelve SOLO un JSON válido.

            Estructura exacta:

            {
              "category": "",
              "brand": "",
              "tags": []
            }

            category:
            categoría general retail en una sola palabra o frase corta.
            Ejemplos: calzado, belleza, tecnologia, muebles, moda, deportes.

            brand:
            marca principal detectada.
            Si no hay marca clara, usar "".

            tags:
            lista corta de palabras clave útiles para búsqueda.
            Ejemplos: urbano, running, mujer, premium, zapatillas.
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

    const text = response.text
      .replaceAll("```json", "")
      .replaceAll("```", "")
      .trim()

    const parsed = JSON.parse(text)

    return res.status(200).json(parsed)
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      error: "Error analizando imagen",
      detail: error.message,
    })
  }
})

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})