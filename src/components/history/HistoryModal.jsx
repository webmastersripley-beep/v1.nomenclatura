import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getProcessHistory } from "@/services/historyService"
import { useUserStore } from "@/store/useUserStore"

export default function HistoryModal({ onClose }) {
  const user = useUserStore((state) => state.user)

  const [history, setHistory] = useState([])
  const [userFilter, setUserFilter] = useState("")
  const [campaignFilter, setCampaignFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  async function loadHistory(filters = {}) {
    try {
      const data = await getProcessHistory(filters)
      setHistory(data)
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error cargando historial")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory()
  }, [])

  const handleApplyFilters = () => {
    setIsLoading(true)
    loadHistory({
      userName: userFilter,
      campaign: campaignFilter,
    })
  }

  const handleMyProcesses = () => {
    const currentUserName = user?.name || ""
    setUserFilter(currentUserName)
    setIsLoading(true)
    loadHistory({
      userName: currentUserName,
      campaign: campaignFilter,
    })
  }

  const handleReset = () => {
    setUserFilter("")
    setCampaignFilter("")
    setIsLoading(true)
    loadHistory()
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[115] p-4">
      <div className="w-full max-w-6xl max-h-[88vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold">Historial</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Procesos anteriores, usuarios y archivos generados.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 border-b border-zinc-800 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto] gap-3">
          <input
            value={userFilter}
            onChange={(event) => setUserFilter(event.target.value)}
            placeholder="Filtrar por usuario"
            className={inputClass}
          />
          <input
            value={campaignFilter}
            onChange={(event) => setCampaignFilter(event.target.value)}
            placeholder="Filtrar por campaña"
            className={inputClass}
          />
          <button onClick={handleApplyFilters} className="px-4 py-3 rounded-xl bg-white text-black font-medium hover:opacity-90 transition">
            Aplicar
          </button>
          <button onClick={handleMyProcesses} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition">
            Mis procesos
          </button>
          <button onClick={handleReset} className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition">
            Limpiar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && <p className="text-zinc-500">Cargando historial...</p>}

          {!isLoading && history.length === 0 && (
            <div className="border border-dashed border-zinc-700 rounded-2xl p-10 text-center text-zinc-500">
              No hay procesos para esos filtros. 
            </div>
          )}

          <div className="space-y-4">
            {history.map((process) => (
              <HistoryCard key={process.id} process={process} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HistoryCard({ process }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">{formatDateTime(process.created_at)}</h3>
          <p className="text-sm text-zinc-500 mt-1">
            {process.app_user_name || "anonimo"} · {process.campaign || "-"} · {process.country || "-"}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
            {process.total_files} archivos
          </span>
          <span className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
            {process.total_families} familias
          </span>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 text-sm text-cyan-300 hover:text-cyan-200 transition"
      >
        {expanded ? "Ocultar archivos" : "Ver archivos generados"}
      </button>

      {expanded && (
        <div className="mt-4 border-t border-zinc-800 pt-4 space-y-2">
          {process.items.map((item, index) => (
            <div
              key={`${process.id}-${item.final_name}-${index}`}
              className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"
            >
              <p className="text-xs text-zinc-500">{item.original_name}</p>
              <p className="text-sm break-all mt-1">{item.final_name}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function formatDateTime(value) {
  if (!value) return "sin fecha"

  return new Date(value).toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

const inputClass = `
  w-full bg-zinc-950 border border-zinc-800 rounded-xl
  px-4 py-3 text-white outline-none focus:border-zinc-600
`
