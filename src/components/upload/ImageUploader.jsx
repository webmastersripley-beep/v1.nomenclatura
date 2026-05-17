import { Upload } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { parseFileName } from "@/utils/parseFileName"
import { groupFamilies } from "@/utils/groupFamilies"
import { getImageDimensions } from "@/utils/getImageDimensions"
import { detectBySize } from "@/utils/detectBySize"

export default function ImageUploader({ onFilesReady }) {
  const onDrop = async (acceptedFiles) => {
    const parsedFiles = await Promise.all(
      acceptedFiles.map(async (file) => {
        const dimensions = await getImageDimensions(file)

        const parsedName = parseFileName(file.name)

        const sizeDetection = detectBySize(
          dimensions.width,
          dimensions.height
        )

        return {
          ...parsedName,

          file,

          previewUrl: dimensions.previewUrl,

          width: dimensions.width,
          height: dimensions.height,

          format:
            parsedName.format ||
            sizeDetection?.format ||
            null,

          detectedComponentBySize:
            sizeDetection?.component || null,

          detectedBySize:
            Boolean(sizeDetection),
        }
      })
    )

    const groupedData = groupFamilies(parsedFiles)

    onFilesReady(groupedData)
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    accept: {
      "image/webp": [".webp"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    onDrop,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-3xl p-24 text-center cursor-pointer transition
        ${isDragActive
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
            Arrastra imágenes aquí
          </p>

          <p className="text-zinc-500 mt-2">
            o haz click para seleccionar archivos
          </p>
        </div>
      </div>
    </div>
  )
}