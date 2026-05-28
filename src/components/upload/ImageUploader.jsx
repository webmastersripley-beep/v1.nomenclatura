import { useRef, useState } from "react"
import { FolderOpen, Upload } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { parseFileName } from "@/utils/parseFileName"
import { groupFamilies } from "@/utils/groupFamilies"
import { getImageDimensions } from "@/utils/getImageDimensions"
import { classifyImageFamily } from "@/utils/classifyImageFamily"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { resolveRuleProfile } from "@/utils/ruleProfiles"

export default function ImageUploader({
  onFilesReady,
  disabled = false,
  statusText = "",
}) {
  const folderInputRef = useRef(null)
  const defaultConfig = useNomenclaturaStore((state) => state.defaultConfig)
  const [isPreparing, setIsPreparing] = useState(false)

  const prepareFiles = async (acceptedFiles) => {
    if (disabled) return

    setIsPreparing(true)

    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/")
    )

    try {
      const effectiveRuleProfile = resolveRuleProfile(
        defaultConfig.ruleProfile,
        defaultConfig.campaign
      )
      const parsedFiles = await Promise.all(
        imageFiles.map(async (file) => {
          const dimensions = await getImageDimensions(file)
          const parsedName = parseFileName(file.name)
          const classification = classifyImageFamily({
            fileName: file.webkitRelativePath || file.name,
            width: dimensions.width,
            height: dimensions.height,
            ruleProfile: effectiveRuleProfile,
            campaign: defaultConfig.campaign,
            worldMode: Boolean(defaultConfig.worldMode),
          })
          const inferredPiece =
            classification.isWorldFamily
              ? buildWorldProvisionalPiece(
                  classification.defaultPiece,
                  parsedName.piece || file.name
                )
              : !classification.nameFamily && classification.defaultPiece
              ? classification.defaultPiece
              : parsedName.piece || classification.defaultPiece || null

          return {
            ...parsedName,
            file,
            previewUrl: dimensions.previewUrl,
            width: dimensions.width,
            height: dimensions.height,
            ratio: classification.ratio,
            dimension: classification.dimension,
            nameFamily: classification.nameFamily,
            sizeFamily: classification.sizeFamily,
            finalFamily: classification.finalFamily,
            familyConfidence: classification.confidence,
            familyStatus: classification.status,
            familyReasons: classification.reasons,
            nameVersion: classification.nameVersion,
            sizeVersion: classification.sizeVersion,
            detectedVersion: classification.version,
            ruleProfile: classification.ruleProfile,
            worldMode: Boolean(defaultConfig.worldMode),
            componentFamily: classification.componentFamily,
            isWorldFamily: classification.isWorldFamily,
            familyClassification: classification,
            piece: inferredPiece,
            format:
              parsedName.format ||
              classification.format ||
              null,
            detectedComponentBySize:
              classification.sizeFamily || null,
            detectedBySize:
              Boolean(classification.sizeFamily),
          }
        })
      )

      const groupedData = groupFamilies(parsedFiles)

      onFilesReady(groupedData)
    } finally {
      setIsPreparing(false)
    }
  }

  const onDrop = async (acceptedFiles) => {
    await prepareFiles(acceptedFiles)
  }

  const handleFolderChange = async (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    await prepareFiles(files)
    event.target.value = ""
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    accept: {
      "image/webp": [".webp"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    onDrop,
    disabled: isPreparing || disabled,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          cursor-pointer rounded-3xl border-2 border-dashed p-24 text-center transition
          ${isPreparing
            ? "cursor-wait border-zinc-800 bg-zinc-950"
            : disabled
            ? "cursor-not-allowed border-zinc-800 bg-zinc-950/70 opacity-70"
            : isDragActive
            ? "border-white bg-zinc-900"
            : "border-zinc-700 hover:border-zinc-500"
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          <Upload size={52} className="text-zinc-400" />

          <div>
            <p className="text-2xl font-semibold">
              Arrastra imagenes aqui
            </p>

            <p className="mt-2 text-zinc-500">
              {statusText || "o haz click para seleccionar archivos"}
            </p>
          </div>
        </div>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        directory=""
        onChange={handleFolderChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => folderInputRef.current?.click()}
        disabled={isPreparing || disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FolderOpen size={18} />
        {isPreparing
          ? "Analizando..."
          : disabled
          ? "Preparando campana"
          : "Seleccionar carpeta"}
      </button>
    </div>
  )
}

function buildWorldProvisionalPiece(defaultPiece, sourcePiece = "") {
  const cleanDefault = String(defaultPiece || "")
  const cleanSource = String(sourcePiece || "").toLowerCase()
  const index = cleanSource.match(/(\d{1,2})/)?.[1]

  if (!cleanDefault || !index) return cleanDefault

  return `${cleanDefault}${Number(index)}`
}
