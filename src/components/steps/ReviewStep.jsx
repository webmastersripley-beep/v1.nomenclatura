import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { toast } from "sonner"

import ImageModal from "@/components/common/ImageModal"
import { recordProcessEvent } from "@/services/processAuditService"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

const EMPTY_MANUAL_FILES = []

export default function ReviewStep({ families, onBack, onNext }) {
  const manualFiles = useNomenclaturaStore((state) => state.manualFiles) || EMPTY_MANUAL_FILES
  const moveManualToFamily = useNomenclaturaStore((state) => state.moveManualToFamily)
  const moveFileToFamily = useNomenclaturaStore((state) => state.moveFileToFamily)
  const moveFileToManual = useNomenclaturaStore((state) => state.moveFileToManual)
  const createEmptyFamily = useNomenclaturaStore((state) => state.createEmptyFamily)
  const processAuditId = useNomenclaturaStore((state) => state.processAuditId)
  const processAuditStatus = useNomenclaturaStore((state) => state.processAuditStatus)
  const processAuditError = useNomenclaturaStore((state) => state.processAuditError)

  const [showManuals, setShowManuals] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [activeFamilyId, setActiveFamilyId] = useState(null)
  const [activeDrag, setActiveDrag] = useState(null)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    })
  )

  const activeFamily =
    families.find((family) => family.familyId === activeFamilyId) || null
  const imageList = useMemo(
    () => [
      ...families.flatMap((family) => family.files),
      ...manualFiles,
    ]
      .filter((file) => file.previewUrl)
      .map((file) => ({
        src: file.previewUrl,
        name: file.originalName,
      })),
    [families, manualFiles]
  )

  const collisionDetection = (args) => {
    const activeData = args.active?.data?.current
    const rectCollisions = rectIntersection(args)

    if (activeFamilyId && activeData?.type === "manual") {
      const detailDropId = `family-detail-${activeFamilyId}`
      const detailCollision = rectCollisions.find(
        (collision) => collision.id === detailDropId
      )

      if (detailCollision) {
        return [detailCollision]
      }
    }

    const pointerCollisions = pointerWithin(args)

    return pointerCollisions.length > 0
      ? pointerCollisions
      : rectCollisions
  }

  const getAvailableFormat = (targetFamily, requestedFormat) => {
    const cleanFormat = (requestedFormat || "").trim().toLowerCase()
    const existingFormats = new Set(
      targetFamily.files
        .map((file) => file.format || file.detectedFormat || "")
        .filter(Boolean)
    )

    if (cleanFormat) {
      return existingFormats.has(cleanFormat) ? null : cleanFormat
    }

    const missingFormats = ["desk", "mb", "app"].filter(
      (format) => !existingFormats.has(format)
    )

    return missingFormats.length === 1 ? missingFormats[0] : ""
  }

  const handleDragStart = (event) => {
    setActiveDrag(event.active.data.current || null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveDrag(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || !overData) return

    if (activeData.type === "manual" && overData.type === "family") {
      const targetFamily = families.find(
        (family) => family.familyId === overData.familyId
      )

      if (!targetFamily) return

      const resolvedFormat = getAvailableFormat(
        targetFamily,
        activeData.format || activeData.detectedFormat
      )

      if (resolvedFormat === null) {
        toast.error("Esa familia ya tiene una pieza con ese formato.")
        return
      }

      if (!resolvedFormat) {
        toast.error("Selecciona formato antes de mover esta pieza.")
        return
      }

      moveManualToFamily(
        activeData.manualId,
        overData.familyId,
        resolvedFormat
      )
      recordReviewEvent(processAuditId, {
        type: "manual_to_family",
        originalName: activeData.file?.originalName,
        targetFamilyId: overData.familyId,
        payload: {
          format: resolvedFormat,
        },
      })
    }

    if (activeData.type === "family-file" && overData.type === "family") {
      const targetFamily = families.find(
        (family) => family.familyId === overData.familyId
      )

      if (targetFamily) {
        const duplicateFormat = targetFamily.files.some(
          (file) =>
            (file.format || file.detectedFormat) ===
            (activeData.format || activeData.detectedFormat)
        )

        if (activeData.sourceFamilyId !== overData.familyId && duplicateFormat) {
          toast.error("Esa familia ya tiene una pieza con ese formato.")
          return
        }
      }

      moveFileToFamily(
        activeData.originalName,
        activeData.sourceFamilyId,
        overData.familyId
      )
      recordReviewEvent(processAuditId, {
        type: "file_to_family",
        originalName: activeData.originalName,
        sourceFamilyId: activeData.sourceFamilyId,
        targetFamilyId: overData.familyId,
      })
    }

    if (activeData.type === "family-file" && overData.type === "manual-zone") {
      moveFileToManual(
        activeData.originalName,
        activeData.sourceFamilyId
      )
      recordReviewEvent(processAuditId, {
        type: "file_to_manual",
        originalName: activeData.originalName,
        sourceFamilyId: activeData.sourceFamilyId,
      })
    }
  }

  useKeyboardShortcuts([
    {
      key: "m",
      enabled: !selectedImage,
      handler: () => setShowManuals((current) => !current),
    },
    {
      key: "Escape",
      enabled: !selectedImage && Boolean(activeFamilyId),
      handler: () => setActiveFamilyId(null),
    },
  ])

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveDrag(null)}
        onDragEnd={handleDragEnd}
      >
        <section className="
          fixed inset-0 z-[90]
          overflow-hidden
          bg-black/90
          p-3 sm:p-6
          backdrop-blur-xl
        ">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(217,70,239,0.14),transparent_28%),radial-gradient(circle_at_100%_8%,rgba(34,211,238,0.12),transparent_26%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.015)_50%)]" />
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />

          <div className={`
            relative mx-auto grid h-full min-h-0 max-w-[1500px] gap-4
            ${showManuals ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1"}
          `}>
            <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
              <div className="
                mb-4 shrink-0 rounded-[1.8rem]
                border border-white/10
                bg-white/[0.045]
                p-5 sm:p-6
                shadow-2xl shadow-black/15
                backdrop-blur-xl
              ">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      Revisión
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Revisión automática
                    </h2>

                    <p className="mt-2 max-w-2xl text-zinc-400">
                      Familias compactas para revisar rápido. Abre una card solo cuando necesites mover piezas.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <SupabaseStatusBadge
                      status={processAuditStatus}
                      error={processAuditError}
                    />

                    <button
                      onClick={() => setShowManuals(!showManuals)}
                      aria-keyshortcuts="M"
                      title="Mostrar u ocultar manuales"
                      className="rounded-xl bg-zinc-800 px-4 py-2 font-medium transition hover:bg-zinc-700"
                    >
                      {showManuals ? "Ocultar manuales" : `Mostrar manuales (${manualFiles.length})`}
                    </button>

                    <button
                      onClick={onBack}
                      className="rounded-xl bg-zinc-800 px-4 py-2 transition hover:bg-zinc-700"
                    >
                      Volver
                    </button>

                    <button
                      onClick={onNext}
                      className="rounded-xl bg-white px-4 py-2 font-medium text-black transition hover:opacity-90"
                    >
                      Continuar a edición
                    </button>
                  </div>
                </div>
              </div>

              <div className="
                grid min-h-0 flex-1 auto-rows-max grid-cols-1 items-start gap-4
                md:grid-cols-2
                2xl:grid-cols-3
                overflow-y-auto overscroll-contain pr-1 pb-8
                scrollbar-modern
              ">
                {families.map((family) => (
                  <FamilyDropCard
                    key={family.familyId}
                    family={family}
                    onOpen={() => setActiveFamilyId(family.familyId)}
                    onImageClick={setSelectedImage}
                  />
                ))}
              </div>
            </main>

            {showManuals && (
              <ManualPanel
                manualFiles={manualFiles}
                createEmptyFamily={createEmptyFamily}
                processAuditId={processAuditId}
                onImageClick={setSelectedImage}
              />
            )}
          </div>
        </section>
        {activeFamily && (
          <FamilyDetailOverlay
            family={activeFamily}
            families={families}
            manualFiles={manualFiles}
            createEmptyFamily={createEmptyFamily}
            moveFileToFamily={moveFileToFamily}
            moveFileToManual={moveFileToManual}
            processAuditId={processAuditId}
            onImageClick={setSelectedImage}
            onClose={() => setActiveFamilyId(null)}
          />
        )}
        <DragOverlay dropAnimation={null} zIndex={160}>
          {activeDrag ? (
            <DragPreview drag={activeDrag} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          images={imageList}
          onClose={() => setSelectedImage(null)}
          onImageChange={setSelectedImage}
        />
      )}
    </>
  )
}

function SupabaseStatusBadge({ status, error }) {
  const labelMap = {
    syncing: "Sincronizando",
    saved: "Guardado en Supabase",
    error: "Error al guardar",
    disabled: "Supabase no configurado",
    idle: "Supabase pendiente",
  }

  return (
    <span
      title={error || labelMap[status] || "Supabase"}
      className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold ${
        status === "error"
          ? "bg-red-500/15 text-red-200"
          : status === "saved"
            ? "bg-emerald-500/15 text-emerald-200"
            : "bg-zinc-800 text-zinc-300"
      }`}
    >
      {labelMap[status] || "Supabase"}
    </span>
  )
}

function recordReviewEvent(processAuditId, event) {
  recordProcessEvent(processAuditId, event).catch((error) => {
    console.error(error)
  })
}

function DragPreview({ drag }) {
  const file = drag.file

  if (!file) return null

  return (
    <div className="
      pointer-events-none
      w-[280px] overflow-hidden
      rounded-[1.35rem]
      border border-white/25
      bg-zinc-950/95
      p-2.5
      shadow-[0_24px_80px_rgba(0,0,0,0.55)]
      backdrop-blur-xl
    ">
      <div className="grid min-h-[76px] grid-cols-[72px_minmax(0,1fr)] gap-3">
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.originalName}
            className="h-[72px] w-[72px] rounded-2xl border border-white/10 bg-black object-cover"
          />
        ) : (
          <div className="h-[72px] w-[72px] rounded-2xl bg-zinc-800" />
        )}

        <div className="min-w-0 self-center">
          <p className="truncate text-sm font-semibold text-white">
            {file.originalName}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {drag.format || drag.detectedFormat || file.format || file.detectedFormat || "sin formato"}
          </p>
        </div>
      </div>
    </div>
  )
}

function FamilyDropCard({ family, onOpen, onImageClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `family-${family.familyId}`,
    data: {
      type: "family",
      familyId: family.familyId,
    },
  })

  return (
    <article
      ref={setNodeRef}
      className={`
        group relative min-h-[330px] overflow-hidden
        rounded-[1.75rem]
        border p-4 transition
        bg-white/[0.04]
        shadow-xl shadow-black/10
        backdrop-blur-xl
        ${isOver ? "border-white bg-white/10" : "border-white/10 hover:border-white/20"}
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-cyan-500/[0.04] opacity-70" />

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold">
              Familia {family.piece}
              {family.groupNumber ? (
                <span className="ml-2 font-normal text-zinc-500">
                  grupo {family.groupNumber}
                </span>
              ) : null}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {family.files.length} pieza(s)
            </p>

            <ClassificationBadges
              item={family.files[0]}
              compact
            />
          </div>

          <div className="flex shrink-0 gap-1.5">
            {family.files.slice(0, 4).map((file) => (
              <span
                key={`${file.originalName}-${file.format}`}
                className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-zinc-300"
              >
                {file.format || "sin formato"}
              </span>
            ))}
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onOpen()
            }
          }}
          className="mt-4 block w-full text-left"
        >
          <FamilyStackPreview
            family={family}
            onImageClick={onImageClick}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Vista compacta: toca para abrir la familia.
          </p>

          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/[0.1]"
          >
            Ver piezas
          </button>
        </div>

      </div>
    </article>
  )
}

function FamilyStackPreview({ family, onImageClick }) {
  const previewFiles = family.files.slice(0, 3)
  const hiddenCount = Math.max(family.files.length - previewFiles.length, 0)

  return (
    <div className="relative h-[180px] overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/35 sm:h-[190px]">
      {previewFiles.map((file, index) => (
        <CompactFamilyFileDragCard
          key={file.originalName}
          file={file}
          familyId={family.familyId}
          index={index}
          onImageClick={onImageClick}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {family.files[0]?.originalName || "Familia vacía"}
          </p>
          <p className="mt-1 truncate text-xs text-zinc-400">
            {family.files.map((file) => file.format || "sin formato").join(" · ")}
          </p>
        </div>

        {hiddenCount > 0 && (
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-black">
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  )
}

function CompactFamilyFileDragCard({ file, familyId, index, onImageClick }) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `compact-file-${familyId}-${file.originalName}`,
      data: {
        type: "family-file",
        file,
        originalName: file.originalName,
        format: file.format,
        detectedFormat: file.detectedFormat,
        sourceFamilyId: familyId,
      },
    })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => {
        event.stopPropagation()
        if (!file.previewUrl) return
        onImageClick({
          src: file.previewUrl,
          name: file.originalName,
        })
      }}
      className={`
        absolute top-4 bottom-4
        w-[72%] overflow-hidden rounded-2xl
        border border-white/10 bg-black
        shadow-2xl shadow-black/30
        transition duration-300
        cursor-grab active:cursor-grabbing
        touch-none
        group-hover:-translate-y-1
        ${isDragging ? "opacity-35" : ""}
        ${index === 0 ? "left-4 z-30" : ""}
        ${index === 1 ? "left-[18%] z-20 rotate-2 opacity-85" : ""}
        ${index === 2 ? "left-[31%] z-10 rotate-3 opacity-70" : ""}
      `}
      title={`Arrastrar ${file.originalName}`}
    >
      {file.previewUrl ? (
        <img
          src={file.previewUrl}
          alt={file.originalName}
          draggable={false}
          className="pointer-events-none h-full w-full object-contain"
        />
      ) : (
        <div className="h-full w-full bg-zinc-800" />
      )}
    </div>
  )
}

function ManualPanel({
  manualFiles,
  createEmptyFamily,
  processAuditId,
  onImageClick,
  scope = "main",
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `manual-drop-zone-${scope}`,
    data: {
      type: "manual-zone",
    },
  })

  return (
    <aside
      ref={setNodeRef}
      className={`
        relative
        h-full min-h-0 overflow-hidden
        rounded-[1.8rem]
        border
        bg-white/[0.045]
        shadow-2xl shadow-black/20
        backdrop-blur-xl
        transition-all duration-300
        ${isOver
          ? "border-white/60 bg-white/[0.14] ring-2 ring-white/25"
          : "border-white/10"
        }
      `}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(217,70,239,0.18),transparent_32%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.1),transparent_32%)]" />

      <div className="relative flex h-full min-h-0 flex-col p-3">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white">
              Manuales
            </p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-zinc-300">
              {manualFiles.length}
            </span>
          </div>
          <p className="mt-1 text-xs leading-snug text-zinc-400">
            Arrastra desde aquí hacia una familia.
          </p>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-modern">
          {manualFiles.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs leading-relaxed text-zinc-400">
                No hay manuales pendientes. También puedes soltar piezas aquí para sacarlas de una familia.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {manualFiles.map((file) => (
                <ManualDraggableCard
                  key={file.manualId}
                  file={file}
                  onImageClick={onImageClick}
                  scope={scope}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            createEmptyFamily()
            recordReviewEvent(processAuditId, {
              type: "create_family",
              payload: {
                source: scope,
              },
            })
          }}
          className="
            mt-3 w-full
            rounded-[1.35rem]
            border border-white/10
            bg-white text-black
            px-4 py-3
            text-sm font-bold
            shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]
            transition hover:bg-zinc-200
          "
        >
          + Crear familia
        </button>
      </div>
    </aside>
  )
}

function ManualDraggableCard({ file, onImageClick, scope = "main" }) {
  const [format, setFormat] = useState(file.format || file.detectedFormat || "")

  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `manual-${scope}-${file.manualId}`,
      data: {
        type: "manual",
        file,
        manualId: file.manualId,
        format,
        detectedFormat: file.detectedFormat,
      },
    })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        group
        grid min-h-[92px] w-full
        grid-cols-[72px_minmax(0,1fr)]
        gap-3
        rounded-[1.35rem]
        border border-white/10
        bg-black/35
        p-2.5
        cursor-grab active:cursor-grabbing
        touch-none
        shadow-inner shadow-white/[0.03]
        transition
        hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {file.previewUrl ? (
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => {
            event.stopPropagation()
            onImageClick({
              src: file.previewUrl,
              name: file.originalName,
            })
          }}
          className="block h-full min-h-[72px] w-full overflow-hidden rounded-2xl border border-white/5 bg-black"
        >
          <img
            src={file.previewUrl}
            alt={file.originalName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        </button>
      ) : (
        <div className="h-full w-full rounded-2xl bg-zinc-800" />
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100">
          {file.originalName}
        </p>

        <div className="mt-1 flex gap-1.5 overflow-hidden">
          {file.width && file.height ? (
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
              {file.width}x{file.height}
            </span>
          ) : null}

          {file.detectedFormat ? (
            <span className="truncate rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-300">
              {file.detectedFormat}
            </span>
          ) : null}
        </div>

        <ClassificationBadges item={file} compact />
        <ClassificationReason item={file} />

        <label
          className="mt-2 block"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className="
              w-full rounded-xl border border-white/10
              bg-zinc-950/85 px-3 py-1.5
              text-sm text-white outline-none transition
              focus:border-white/30
            "
          >
            <option value="">Seleccionar</option>
            <option value="desk">desk</option>
            <option value="mb">mb</option>
            <option value="app">app</option>
          </select>
        </label>
      </div>
    </div>
  )
}

function FamilyDetailOverlay({
  family,
  families,
  manualFiles,
  createEmptyFamily,
  moveFileToFamily,
  moveFileToManual,
  processAuditId,
  onImageClick,
  onClose,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `family-detail-${family.familyId}`,
    data: {
      type: "family",
      familyId: family.familyId,
    },
  })

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-xl"
      onMouseDown={onClose}
    >
      <div
        className="relative grid h-full max-h-[92dvh] w-full max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/92 shadow-[0_40px_160px_rgba(0,0,0,0.65)] lg:grid-cols-[minmax(0,1fr)_320px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(217,70,239,0.16),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.1),transparent_30%)]" />

        <section
          ref={setNodeRef}
          className={`relative min-w-0 overflow-y-auto p-4 transition sm:p-6 scrollbar-modern ${
            isOver ? "bg-white/[0.06] ring-2 ring-inset ring-white/25" : ""
          }`}
        >
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Detalle de familia
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                Familia {family.piece}
                {family.groupNumber ? (
                  <span className="ml-2 font-normal text-zinc-500">
                    grupo {family.groupNumber}
                  </span>
                ) : null}
              </h3>

              <p className="mt-2 text-sm text-zinc-400">
                {family.files.length} pieza(s). Arrastra manuales aquí o mueve piezas con los controles.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
            >
              Cerrar
            </button>
          </div>

          <div
            className={`mb-5 rounded-[1.4rem] border border-dashed px-4 py-3 text-sm transition ${
              isOver
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/10 bg-white/[0.03] text-zinc-500"
            }`}
          >
            Suelta aqui para agregar manuales a esta familia.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {family.files.map((file) => (
              <FamilyDetailFileCard
                key={file.originalName}
                file={file}
                family={family}
                families={families}
                moveFileToFamily={moveFileToFamily}
                moveFileToManual={moveFileToManual}
                onImageClick={onImageClick}
                onClose={onClose}
              />
            ))}
          </div>
        </section>

        <aside className="relative hidden min-h-0 border-l border-white/10 bg-white/[0.035] p-3 lg:block">
          <ManualPanel
            manualFiles={manualFiles}
            createEmptyFamily={createEmptyFamily}
            processAuditId={processAuditId}
            onImageClick={onImageClick}
            scope="detail"
          />
        </aside>
      </div>
    </div>
  )
}

function FamilyDetailFileCard({
  file,
  family,
  families,
  moveFileToFamily,
  moveFileToManual,
  onImageClick,
  onClose,
}) {
  const { attributes, listeners, setNodeRef, isDragging } =
    useDraggable({
      id: `detail-file-${family.familyId}-${file.originalName}`,
      data: {
        type: "family-file",
        file,
        originalName: file.originalName,
        format: file.format,
        detectedFormat: file.detectedFormat,
        sourceFamilyId: family.familyId,
      },
    })

  const otherFamilies = families.filter(
    (item) => item.familyId !== family.familyId
  )

  return (
    <article
      ref={setNodeRef}
      className={`overflow-hidden rounded-[1.45rem] border border-white/10 bg-black/35 transition hover:border-white/20 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        {file.previewUrl ? (
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation()
              onImageClick({
                src: file.previewUrl,
                name: file.originalName,
              })
            }}
            className="block w-full"
          >
            <img
              src={file.previewUrl}
              alt={file.originalName}
              className="h-44 w-full bg-black object-contain"
            />
          </button>
        ) : (
          <div className="h-44 w-full bg-zinc-900" />
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="break-all text-sm font-semibold text-zinc-100">
            {file.originalName}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Formato: {file.format || "sin formato"}
          </p>
          <ClassificationBadges item={file} />
          <ClassificationReason item={file} />
          <CompressionInfo item={file} />
        </div>

        <label className="block" onPointerDown={(event) => event.stopPropagation()}>
          <span className="text-xs text-zinc-500">Mover a familia</span>
          <select
            value=""
            onChange={(event) => {
              if (!event.target.value) return
              moveFileToFamily(
                file.originalName,
                family.familyId,
                event.target.value
              )
              event.target.value = ""
            }}
            className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="">Seleccionar destino</option>
            {otherFamilies.map((item) => (
              <option key={item.familyId} value={item.familyId}>
                Familia {item.piece}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            moveFileToManual(file.originalName, family.familyId)
            if (family.files.length <= 1) {
              onClose()
            }
          }}
          className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
        >
          Sacar a manuales
        </button>
      </div>
    </article>
  )
}

function ClassificationBadges({ item, compact = false }) {
  if (!item?.finalFamily && !item?.familyStatus) return null

  const badges = [
    item.finalFamily,
    item.detectedVersion,
    item.familyStatus,
    item.familyConfidence,
  ].filter(Boolean)

  if (badges.length === 0) return null

  return (
    <div className={`mt-2 flex flex-wrap gap-1.5 ${compact ? "max-h-12 overflow-hidden" : ""}`}>
      {badges.map((badge) => (
        <span
          key={badge}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getClassificationBadgeClass(badge)}`}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

function ClassificationReason({ item }) {
  const reasons = Array.isArray(item?.familyReasons)
    ? item.familyReasons
    : []
  const allReasons = [
    ...reasons,
  ]

  if (allReasons.length === 0) return null

  return (
    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500">
      {allReasons[allReasons.length - 1]}
    </p>
  )
}

function getClassificationBadgeClass(value) {
  if (
    value === "INCONSISTENCIA_NOMBRE_TAMANO" ||
    value === "ERROR_READING_IMAGE"
  ) {
    return "bg-red-500/15 text-red-200"
  }

  if (value === "REVISION_MANUAL") {
    return "bg-yellow-500/15 text-yellow-200"
  }

  if (value === "OK" || value === "ALTA") {
    return "bg-emerald-500/15 text-emerald-200"
  }

  if (value === "PREDICCION_POR_TAMANO" || value === "MEDIA") {
    return "bg-cyan-500/15 text-cyan-200"
  }

  return "bg-white/10 text-zinc-300"
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
