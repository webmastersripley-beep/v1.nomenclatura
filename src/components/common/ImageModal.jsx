import { useMemo, useState } from "react"

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { getNextImageZoom } from "@/utils/imageZoom"

export default function ImageModal({
  image,
  images = [],
  onClose,
  onImageChange,
}) {
  const [zoom, setZoom] = useState(1)
  const imageList = useMemo(
    () => Array.isArray(images) ? images.filter(Boolean) : [],
    [images]
  )
  const currentIndex = imageList.findIndex((item) =>
    item?.src === image?.src || item?.name === image?.name
  )
  const canNavigate = imageList.length > 1 && currentIndex >= 0

  const goToImage = (direction) => {
    if (!canNavigate) return

    const nextIndex =
      (currentIndex + direction + imageList.length) % imageList.length

    setZoom(1)
    onImageChange?.(imageList[nextIndex])
  }

  useKeyboardShortcuts([
    {
      key: "Escape",
      enabled: Boolean(image),
      handler: onClose,
    },
    {
      key: "ArrowLeft",
      enabled: Boolean(image) && canNavigate,
      handler: () => goToImage(-1),
    },
    {
      key: "ArrowRight",
      enabled: Boolean(image) && canNavigate,
      handler: () => goToImage(1),
    },
    {
      key: "+",
      enabled: Boolean(image),
      handler: () => setZoom((current) => getNextImageZoom(current, "in")),
    },
    {
      key: "=",
      enabled: Boolean(image),
      handler: () => setZoom((current) => getNextImageZoom(current, "in")),
    },
    {
      key: "-",
      enabled: Boolean(image),
      handler: () => setZoom((current) => getNextImageZoom(current, "out")),
    },
    {
      key: "0",
      enabled: Boolean(image),
      handler: () => setZoom(1),
    },
  ])

  if (!image) return null

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/85 p-6 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-[0_40px_160px_rgba(0,0,0,0.75)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-sm text-zinc-300 break-all">
            {image.name}
          </p>

          <div className="flex shrink-0 items-center gap-2">
            {canNavigate ? (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(-1)}
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm transition hover:bg-zinc-700"
                  aria-keyshortcuts="ArrowLeft"
                  title="Imagen anterior"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(1)}
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm transition hover:bg-zinc-700"
                  aria-keyshortcuts="ArrowRight"
                  title="Imagen siguiente"
                >
                  Siguiente
                </button>
              </>
            ) : null}

            <span className="rounded-xl bg-black px-3 py-2 text-xs font-semibold text-zinc-400">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm"
              aria-keyshortcuts="Escape"
              title="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] overflow-auto rounded-xl bg-black">
          <img
            src={image.src}
            alt={image.name}
            className="mx-auto max-h-[78vh] w-full origin-center rounded-xl object-contain transition-transform"
            style={{
              transform: `scale(${zoom})`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
