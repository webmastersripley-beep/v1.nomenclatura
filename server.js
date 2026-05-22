import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { GoogleGenAI } from "@google/genai"

dotenv.config()

const app = express()
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

app.use(cors())
app.use(
  express.json({
    limit: "20mb",
  })
)

app.post("/api/analyze-image", async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY no configurada",
    })
  }

  try {
    const { imageBase64, mimeType } = req.body

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: "Imagen invalida",
      })
    }

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      contents: [
        {
          text: `
            Analiza esta imagen retail.

            Devuelve SOLO un JSON valido.

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
            marca detectada. Si no hay marca clara, usar "".

            product:
            nombre resumido producto, por ejemplo smartphone, notebook, tv, audifonos.

            campaign:
            tipo de campana detectada.

            tags:
            palabras clave utiles.
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

const PORT = Number(process.env.PORT || 3001)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
