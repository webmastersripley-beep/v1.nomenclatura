import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

export default function ShortcutHelpOverlay({
  open,
  onClose,
  sections = [],
}) {
  useKeyboardShortcuts([
    {
      key: "Escape",
      enabled: open,
      handler: onClose,
    },
  ])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[240] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-[0_40px_160px_rgba(0,0,0,0.75)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Atajos
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Teclado rapido
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-3 py-2 text-sm transition hover:bg-zinc-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <h3 className="text-sm font-bold text-zinc-200">
                {section.title}
              </h3>

              <div className="mt-3 space-y-2">
                {section.items.map((item) => (
                  <div
                    key={`${section.title}-${item.keys}-${item.label}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-zinc-400">
                      {item.label}
                    </span>
                    <kbd className="shrink-0 rounded-lg border border-white/10 bg-black px-2 py-1 text-xs font-semibold text-zinc-200">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
