import { Loader2 } from "lucide-react"

import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"

export default function ProcessingStep() {
  const progress = useNomenclaturaStore((state) => state.processingProgress)
  const total = progress?.total || 0
  const completed = progress?.completed || 0
  const failed = progress?.failed || 0
  const percent =
    total > 0
      ? Math.round((completed / total) * 100)
      : 0
  const visibleItems = progress?.items?.slice(-8) || []

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
      <Loader2 className="mx-auto animate-spin text-zinc-400" size={48} />

      <h2 className="mt-6 text-2xl font-bold">
        Analizando familias
      </h2>

      <p className="mt-2 text-zinc-400">
        Detectando categoria con 1 imagen por familia para ahorrar tokens.
      </p>

      {total > 0 && (
        <div className="mx-auto mt-6 max-w-2xl text-left">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>
              {completed} de {total} procesadas
            </span>
            <span>
              {percent}% {failed > 0 ? `- ${failed} con revision` : ""}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-fuchsia-500 transition-all"
              style={{
                width: `${percent}%`,
              }}
            />
          </div>

          <div className="mt-5 space-y-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-300">
                  {item.originalName}
                </span>

                <span className={getStatusClass(item.status)}>
                  {getStatusLabel(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getStatusLabel(item) {
  if (item.status === "done") return "listo"
  if (item.status === "error") return "revisar"
  if (item.status === "retrying") return `reintento ${item.attempts || ""}`
  if (item.status === "analyzing") return "analizando"
  return "pendiente"
}

function getStatusClass(status) {
  if (status === "done") return "shrink-0 text-green-400"
  if (status === "error") return "shrink-0 text-yellow-300"
  if (status === "retrying") return "shrink-0 text-cyan-300"
  if (status === "analyzing") return "shrink-0 text-fuchsia-300"
  return "shrink-0 text-zinc-500"
}
