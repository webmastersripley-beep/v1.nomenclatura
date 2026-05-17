/*ReviewStep.jsx */
import { useState } from "react"
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core"

import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"

export default function ReviewStep({ families, onBack, onNext }) {
  const manualFiles = useNomenclaturaStore((state) => state.manualFiles) || []
  const moveManualToFamily = useNomenclaturaStore((state) => state.moveManualToFamily)
  const moveFileToFamily = useNomenclaturaStore((state) => state.moveFileToFamily)
  const moveFileToManual = useNomenclaturaStore((state) => state.moveFileToManual)
  const createEmptyFamily = useNomenclaturaStore((state) => state.createEmptyFamily)

  const [showManuals, setShowManuals] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || !overData) return

    if (activeData.type === "manual" && overData.type === "family") {
      moveManualToFamily(
        activeData.manualId,
        overData.familyId,
        activeData.format || ""
      )
    }

    if (activeData.type === "family-file" && overData.type === "family") {
      moveFileToFamily(
        activeData.originalName,
        activeData.sourceFamilyId,
        overData.familyId
      )
    }

    if (activeData.type === "family-file" && overData.type === "manual-zone") {
      moveFileToManual(
        activeData.originalName,
        activeData.sourceFamilyId
      )
    }
  }

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          <div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold">
                Revisión automática
              </h2>

              <p className="text-zinc-400 mt-2">
                Revisa familias detectadas. Arrastra manuales o piezas hacia la familia correcta.
              </p>

              <div className="flex gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => setShowManuals(!showManuals)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition font-medium"
                >
                  {showManuals ? "Ocultar manuales" : `Mostrar manuales (${manualFiles.length})`}
                </button>

                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
                >
                  Volver
                </button>

                <button
                  onClick={onNext}
                  className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90 transition"
                >
                  Continuar a edición
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {families.map((family) => (
                <FamilyDropCard
                  key={family.familyId}
                  family={family}
                  onImageClick={setSelectedImage}
                />
              ))}
            </div>
          </div>

          {showManuals && (
            <ManualSidePanel
              manualFiles={manualFiles}
              createEmptyFamily={createEmptyFamily}
              onImageClick={setSelectedImage}
            />
          )}
        </div>
      </DndContext>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      
      )}
      
    </>
  )
}

function FamilyDropCard({ family, onImageClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `family-${family.familyId}`,
    data: {
      type: "family",
      familyId: family.familyId,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-zinc-900 border rounded-2xl p-5 transition
        ${isOver ? "border-white bg-zinc-800" : "border-zinc-800"}
      `}
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold">
            Familia {family.piece}
            {family.groupNumber ? (
              <span className="text-zinc-500 font-normal ml-2">
                grupo {family.groupNumber}
              </span>
            ) : null}
          </h3>

          <p className="text-sm text-zinc-500 mt-1">
            {family.files.length} pieza(s)
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-end">
          {family.files.map((file) => (
            <span
              key={`${file.originalName}-${file.format}`}
              className="px-2 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300"
            >
              {file.format || "sin formato"}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {family.files.map((file) => (
          <FamilyFileCard
            key={file.originalName}
            file={file}
            familyId={family.familyId}
            onImageClick={onImageClick}
          />
        ))}
      </div>
    </div>
  )
}

function FamilyFileCard({ file, familyId, onImageClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `family-file-${familyId}-${file.originalName}`,
      data: {
        type: "family-file",
        originalName: file.originalName,
        sourceFamilyId: familyId,
      },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {file.previewUrl ? (
          <button
            type="button"
            onDoubleClick={() =>
              onImageClick({
                src: file.previewUrl,
                name: file.originalName,
              })
            }
            className="block w-full"
          >
          <img
            src={file.previewUrl}
            alt={file.originalName}
            className="w-full h-36 object-contain bg-black"
          />
        </button>
      ) : (
        <div className="w-full h-36 bg-zinc-800" />
      )}

      <div className="p-3">
        <p className="text-sm text-zinc-300 break-all">
          {file.originalName}
        </p>

        <p className="text-xs text-zinc-500 mt-2">
          Formato: {file.format || "sin formato"}
        </p>
        <CompressionInfo item={file} />
      </div>
    </div>
  )
}

function ManualSidePanel({ manualFiles, createEmptyFamily, onImageClick }) {
  const { setNodeRef, isOver } =
    useDroppable({
      id: "manual-drop-zone",
      data: {
        type: "manual-zone",
      },
    })

  return (
    <aside
      ref={setNodeRef}
      className={`
        border rounded-2xl p-4 h-fit xl:sticky xl:top-6 transition
        ${isOver
          ? "bg-zinc-800 border-white"
          : "bg-zinc-900 border-zinc-800"
        }
      `}
    >
      <h3 className="text-xl font-bold">
        Manuales
      </h3>

      <p className="text-sm text-zinc-500 mt-1">
        Arrastra piezas aquí para sacarlas de una familia.
      </p>

      <button
        onClick={createEmptyFamily}
        className="w-full mt-4 px-4 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90 transition"
      >
        + Crear familia
      </button>

      <div className="mt-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
        {manualFiles.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay manuales pendientes.
          </p>
        ) : (
          manualFiles.map((file) => (
            <ManualDraggableCard
              key={file.manualId}
              file={file}
              onImageClick={onImageClick}
            />
          ))
        )}
      </div>
    </aside>
  )
}

function ManualDraggableCard({ file, onImageClick }) {
  const [format, setFormat] = useState(file.format || file.detectedFormat || "")

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `manual-${file.manualId}`,
      data: {
        type: "manual",
        manualId: file.manualId,
        format,
      },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {file.previewUrl ? (
          <button
            type="button"
            onDoubleClick={() =>
              onImageClick({
                src: file.previewUrl,
                name: file.originalName,
              })
            }
            className="block w-full"
          >
          <img
            src={file.previewUrl}
            alt={file.originalName}
            className="w-full h-28 object-contain bg-black"
          />
        </button>
      ) : (
        <div className="w-full h-28 bg-zinc-800" />
      )}

      <div className="p-3">
        <p className="text-xs text-zinc-300 break-all">
          {file.originalName}
        </p>

        <div className="flex gap-2 flex-wrap mt-2">
          {file.width && file.height ? (
            <span className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300">
              {file.width}x{file.height}
            </span>
          ) : null}

          {file.detectedFormat ? (
            <span className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300">
              sugerido: {file.detectedFormat}
            </span>
          ) : null}
          <CompressionInfo item={file} />
        </div>

        <label
          className="block mt-3 space-y-1"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <span className="text-xs text-zinc-500">
            Formato para asignar
          </span>

          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
          >
            <option value="">
              Seleccionar
            </option>

            <option value="desk">
              desk
            </option>

            <option value="mb">
              mb
            </option>

            <option value="app">
              app
            </option>
          </select>
        </label>
      </div>
    </div>
  )
}

function ImageModal({ image, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="max-w-5xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-sm text-zinc-300 break-all">
            {image.name}
          </p>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm"
          >
            Cerrar
          </button>
        </div>

        <img
          src={image.src}
          alt={image.name}
          className="w-full max-h-[75vh] object-contain bg-black rounded-xl"
        />
      </div>
    </div>
  )
}
function CompressionInfo({ item }) {
  if (!item.compressed) return null

  return (
    <div className="mt-2 space-y-1">
      <span className="inline-flex px-2 py-1 rounded-lg bg-yellow-500 text-black text-[10px] font-bold">
        comprimida
      </span>

      {item.originalSize && item.compressedSize && (
        <p className="text-[11px] text-yellow-300">
          {Math.round(item.originalSize / 1024)} KB
          {" → "}
          {Math.round(item.compressedSize / 1024)} KB
        </p>
      )}
    </div>
  )
}