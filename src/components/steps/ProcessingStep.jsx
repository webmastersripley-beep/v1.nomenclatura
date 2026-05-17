import { Loader2 } from "lucide-react"

export default function ProcessingStep() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
      <Loader2 className="mx-auto animate-spin text-zinc-400" size={48} />

      <h2 className="text-2xl font-bold mt-6">
        Analizando familias
      </h2>

      <p className="text-zinc-400 mt-2">
        Detectando categoría y generando nomenclaturas iniciales...
      </p>
    </div>
  )
}