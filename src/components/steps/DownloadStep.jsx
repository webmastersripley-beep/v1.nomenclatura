import { useState } from "react"
import { toast } from "sonner"

import {
  buildDownloadZipBlob,
  downloadZip,
} from "@/services/downloadZip"
import { downloadImagesDirect } from "@/services/downloadImagesDirect"
import { saveProcess } from "@/services/saveProcess"
import { compressHeavyImages } from "@/services/compressImages"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { useUserStore } from "@/store/useUserStore"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { validateResults } from "@/utils/validateResults"
import { validateWarnings } from "@/utils/validateWarnings"

export default function DownloadStep({ onBack }) {
  const results = useNomenclaturaStore((state) => state.results) || []
  const setResults = useNomenclaturaStore((state) => state.setResults)
  const setProcessAuditStatus = useNomenclaturaStore((state) => state.setProcessAuditStatus)
  const setProcessAuditError = useNomenclaturaStore((state) => state.setProcessAuditError)
  const resetProject = useNomenclaturaStore((state) => state.resetProject)
  const downloadMode = useUserStore((state) => state.preferences.download_mode)
  const isDirectDownload = downloadMode === "directo"

  const [isSaving, setIsSaving] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [pendingDownload, setPendingDownload] = useState(null)

  const errors = validateResults(results)
  const hasErrors = errors.length > 0

  const warnings = validateWarnings(results)
  const hasWarnings = warnings.length > 0

  const handleNewProcess = () => {
    setPendingDownload(null)
    resetProject()
  }

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
      let zipBlob = null
      let localMessage = ""

      if (isDirectDownload) {
        const downloadResult = await downloadImagesDirect(results)
        zipBlob = await buildDownloadZipBlob(results, "directo")
        localMessage =
          downloadResult.mode === "folder"
            ? `${downloadResult.count} imagen(es) guardada(s) en carpeta`
            : `${downloadResult.count} imagen(es) descargada(s) en ZIP directo`

        setPendingDownload({
          zipBlob,
          downloadMode: "directo",
          localMessage,
        })
        toast.info("Descarga lista. Ponle nombre a la tanda para guardarla en historial.")
        return
      }

      const downloadResult = await downloadZip(results)
      zipBlob = downloadResult.blob
      localMessage = "ZIP descargado"

      setPendingDownload({
        zipBlob,
        downloadMode: downloadResult.mode || downloadMode,
        localMessage,
      })
      toast.info("ZIP descargado. Ponle nombre a la tanda para guardarla en historial.")
    } catch (error) {
      console.error(error)

      if (error?.name === "AbortError") {
        toast.info("Descarga directa cancelada")
        return
      }

      toast.error("Error descargando el proceso")
    } finally {
      setIsSaving(false)
    }
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

  useKeyboardShortcuts([
    {
      key: "d",
      enabled: !pendingDownload && !hasErrors && !isSaving,
      handler: handleDownload,
    },
    {
      key: "c",
      enabled: !pendingDownload && !isCompressing && heavyFiles.length > 0,
      handler: handleCompressImages,
    },
  ])

  useKeyboardShortcuts([
    {
      key: "Escape",
      enabled: Boolean(pendingDownload),
      handler: () => setPendingDownload(null),
    },
  ], {
    ignoreEditable: false,
  })

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
          onClick={handleNewProcess}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
        >
          Nuevo proceso
        </button>

        <button
          onClick={handleDownload}
          disabled={hasErrors || isSaving}
          aria-keyshortcuts="D"
          title="Descarga principal"
          className={`
            px-4 py-2 rounded-xl font-medium transition
            ${
              hasErrors || isSaving
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-white text-black hover:opacity-90"
            }
          `}
        >
          {isSaving
            ? "Guardando..."
            : isDirectDownload
              ? "Guardar y descargar imágenes"
              : "Guardar y descargar ZIP"}
        </button>

        <button
          onClick={handleCompressImages}
          disabled={isCompressing || heavyFiles.length === 0}
          aria-keyshortcuts="C"
          title="Comprimir imagenes pesadas"
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
        {isCompressing
          ? "Comprimiendo..."
          : heavyFiles.length > 0
            ? "Comprimir imágenes pesadas"
            : "Sin imágenes pesadas"}
        </button>
      </div>

      {pendingDownload && (
        <BatchNameModal
          pendingDownload={pendingDownload}
          results={results}
          setProcessAuditStatus={setProcessAuditStatus}
          setProcessAuditError={setProcessAuditError}
          onNewProcess={handleNewProcess}
          onClose={() => setPendingDownload(null)}
          onSaved={() => setPendingDownload(null)}
        />
      )}
    </div>
  )
}

function BatchNameModal({
  pendingDownload,
  results,
  setProcessAuditStatus,
  setProcessAuditError,
  onNewProcess,
  onClose,
  onSaved,
}) {
  const [batchName, setBatchName] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = async () => {
    const cleanName = batchName.trim()

    if (!cleanName) {
      toast.error("Escribe un nombre para la tanda")
      return
    }

    try {
      setIsRegistering(true)
      setProcessAuditStatus("syncing")
      setProcessAuditError("")

      await saveProcess(
        results,
        {
          batchName: cleanName,
          downloadMode: pendingDownload.downloadMode,
          zipBlob: pendingDownload.zipBlob,
        }
      )

      setProcessAuditStatus("saved")
      setIsSaved(true)
      toast.success("Tanda guardada en historial")
    } catch (error) {
      console.error(error)
      setProcessAuditStatus("error")
      setProcessAuditError(error.message || "Error guardando tanda")
      toast.error(error.message || "Error guardando tanda")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <h3 className="text-xl font-bold">
          Nombrar tanda descargada
        </h3>

        <p className="mt-2 text-sm text-zinc-400">
          {isSaved
            ? "La tanda quedo guardada. Puedes iniciar otro proceso con el estado limpio."
            : `${pendingDownload.localMessage}. Este nombre permitira que otros usuarios la encuentren en historial.`}
        </p>

        {!isSaved && (
          <label className="mt-5 block space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Nombre
            </span>
            <input
              value={batchName}
              onChange={(event) => setBatchName(event.target.value)}
              placeholder="DESCARGA1"
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
            />
          </label>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {isSaved ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700"
              >
                Quedarme aqui
              </button>

              <button
                type="button"
                onClick={() => {
                  onNewProcess()
                  onSaved()
                }}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
              >
                Nuevo proceso
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold transition hover:bg-zinc-700"
              >
                Guardar despues
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isRegistering}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                {isRegistering ? "Guardando..." : "Guardar tanda"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
