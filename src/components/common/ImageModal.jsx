export default function ImageModal({ image, onClose }) {
  if (!image) return null

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