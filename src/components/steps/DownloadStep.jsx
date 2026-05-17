/*DowloadStep.jsx */
import { useState } from "react"
import { toast } from "sonner"

import { downloadZip } from "@/services/downloadZip"
import { downloadMetadata } from "@/services/downloadMetadata"
import { saveProcess } from "@/services/saveProcess"
import { compressHeavyImages } from "@/services/compressImages"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { validateResults } from "@/utils/validateResults"
import { validateWarnings } from "@/utils/validateWarnings"

export default function DownloadStep({ onBack }) {
  const results = useNomenclaturaStore((state) => state.results) || []
  const setResults = useNomenclaturaStore((state) => state.setResults)

  const [isSaving, setIsSaving] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)

  const errors = validateResults(results)
  const hasErrors = errors.length > 0

  const warnings = validateWarnings(results)
  const hasWarnings = warnings.length > 0

  const heavyFiles = results.filter(
  (item) =>
    item.file &&
    item.file.size >= 200 * 1024
)

const totalHeavyKb =
  heavyFiles.reduce(
    (accumulator, item) =>
      accumulator + item.file.size,
    0
  ) / 1024

  const handleDownload = async () => {
    if (hasErrors || isSaving) return

    try {
      setIsSaving(true)

      await saveProcess(results)
      await downloadZip(results)

      toast.success("Proceso guardado y ZIP descargado")
    } catch (error) {
      console.error(error)
      toast.error("Error guardando el proceso")
    } finally {
      setIsSaving(false)
    }
  }

  const handleMetadataDownload = () => {
    downloadMetadata(results)
    toast.success("Metadata JSON descargada")
  }

  const handleCompressImages = async () => {
    try {
      setIsCompressing(true)

      const compressedResults = await compressHeavyImages(results)

      setResults(compressedResults)

      toast.success("Imágenes pesadas comprimidas")
    } catch (error) {
      console.error(error)
      toast.error("Error comprimiendo imágenes")
    } finally {
      setIsCompressing(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold">
        Descarga final
      </h2>

      <p className="text-zinc-400 mt-2">
        Validamos los nombres antes de descargar para evitar errores.
      </p>

      <div className="mt-6 bg-zinc-950 border border-zinc-800 rounded-xl p-5">
        <p className="text-zinc-300">
          Archivos listos:
          <span className="font-bold ml-2">
            {results.length}
          </span>
        </p>

        <p className={hasErrors ? "text-red-400 mt-2" : "text-green-400 mt-2"}>
          {hasErrors
            ? `${errors.length} error(es) encontrados`
            : "Todo listo para descargar"}
        </p>
        {heavyFiles.length > 0 && (
          <div className="mt-4 bg-yellow-950/20 border border-yellow-900 rounded-xl p-4">
            <p className="text-yellow-300 font-medium">
              Imágenes pesadas detectadas
            </p>

            <p className="text-sm text-yellow-100 mt-1">
              {heavyFiles.length} archivo(s) superan 200 KB
            </p>

            <p className="text-sm text-yellow-100">
              Peso total aproximado:
              {" "}
              {Math.round(totalHeavyKb)} KB
            </p>
          </div>
        )}

        {hasWarnings && (
          <p className="text-yellow-400 mt-2">
            {warnings.length} advertencia(s) detectadas
          </p>
        )}
      </div>

      {hasErrors && (
        <div className="mt-6 bg-red-950/30 border border-red-900 rounded-xl p-5">
          <h3 className="font-bold text-red-300 mb-3">
            Errores detectados
          </h3>

          <div className="space-y-2">
            {errors.map((error, index) => (
              <p
                key={`${error.id}-${index}`}
                className="text-sm text-red-200"
              >
                {error.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {hasWarnings && (
        <div className="mt-6 bg-yellow-950/30 border border-yellow-900 rounded-xl p-5">
          <h3 className="font-bold text-yellow-300 mb-3">
            Advertencias detectadas
          </h3>

          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <p
                key={`${warning.id}-${index}`}
                className="text-sm text-yellow-100"
              >
                {warning.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-6 flex-wrap">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          Volver a editar
        </button>

        <button
          onClick={handleDownload}
          disabled={hasErrors || isSaving}
          className={`
            px-4 py-2 rounded-xl font-medium transition
            ${
              hasErrors || isSaving
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-white text-black hover:opacity-90"
            }
          `}
        >
          {isSaving ? "Guardando..." : "Guardar y descargar ZIP"}
        </button>

        <button
          onClick={handleMetadataDownload}
          className="
            px-4 py-2
            rounded-xl
            bg-zinc-800
            hover:bg-zinc-700
            transition
            text-white
            font-medium
          "
        >
          Descargar metadata JSON
        </button>

        <button
          onClick={handleCompressImages}
          disabled={isCompressing || heavyFiles.length === 0}
          className={`
            px-4 py-2
            rounded-xl
            transition
            font-medium
            ${
              isCompressing
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }
          `}
        >
        {isCompressing ? "Comprimiendo..." : heavyFiles.length > 0 ? "Comprimir imágenes pesadas" : "Sin imágenes pesadas"} 
        </button>
      </div>
    </div>
  )
}