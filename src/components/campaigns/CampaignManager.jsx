import { useEffect, useState } from "react"
import DatePicker from "react-datepicker"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import {
  getAllCampaigns,
  createCampaign,
  disableCampaign,
} from "@/services/campaignService"

import { useUserStore } from "@/store/useUserStore"

export default function CampaignManager({ onClose }) {
  const user = useUserStore((state) => state.user)
  const preferences = useUserStore((state) => state.preferences)

  const [campaigns, setCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const [form, setForm] = useState({
    name: "",
    code: "",
    country: preferences.default_country || "cl",
    start_at: null,
    end_at: null,
  })

  useEffect(() => {
    loadCampaigns()
  }, [form.country])

  const loadCampaigns = async () => {
    try {
      setIsLoading(true)

      const data = await getAllCampaigns(form.country)

      setCampaigns(data)
    } catch (error) {
      console.error(error)
      toast.error("Error cargando campañas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      if (!form.name || !form.code || !form.start_at || !form.end_at) {
        toast.error("Completa todos los campos")
        return
      }

      if (form.end_at <= form.start_at) {
        toast.error("La fecha de término debe ser posterior al inicio")
        return
      }

      setIsCreating(true)

      await createCampaign({
        ...form,
        created_by_name: user?.name || "anonimo",
        created_by_id: user?.id || null,
      })

      toast.success("Campaña creada")

      setForm({
        name: "",
        code: "",
        country: preferences.default_country || "cl",
        start_at: null,
        end_at: null,
      })

      await loadCampaigns()
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error creando campaña")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDisable = async (id) => {
    try {
      await disableCampaign(id)

      toast.success("Campaña desactivada")

      await loadCampaigns()
    } catch (error) {
      console.error(error)
      toast.error("Error desactivando campaña")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4">
      <div className="w-full max-w-6xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold">
              Gestión campañas
            </h2>

            <p className="text-zinc-400 text-sm mt-1">
              Programa campañas activas por fecha y hora.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr]">
          <aside className="border-r border-zinc-800 p-6">
            <h3 className="font-bold mb-5">
              Nueva campaña
            </h3>

            <div className="space-y-4">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Nombre campaña"
                className={inputClass}
              />

              <input
                value={form.code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    code: event.target.value,
                  })
                }
                placeholder="Abreviatura campaña"
                className={inputClass}
              />

              <select
                value={form.country}
                onChange={(event) =>
                  setForm({
                    ...form,
                    country: event.target.value,
                  })
                }
                className={inputClass}
              >
                <option value="cl">Chile</option>
                <option value="pe">Perú</option>
                <option value="co">Colombia</option>
              </select>

              <DateField
                label="Inicio"
                selected={form.start_at}
                onChange={(date) =>
                  setForm({
                    ...form,
                    start_at: date,
                  })
                }
              />

              <DateField
                label="Término"
                selected={form.end_at}
                onChange={(date) =>
                  setForm({
                    ...form,
                    end_at: date,
                  })
                }
                minDate={form.start_at}
              />

              <button
                onClick={handleCreate}
                disabled={isCreating}
                className={`
                  w-full px-4 py-3 rounded-xl font-medium transition
                  ${
                    isCreating
                      ? "bg-zinc-700 text-zinc-400"
                      : "bg-white text-black hover:opacity-90"
                  }
                `}
              >
                {isCreating ? "Creando..." : "Crear campaña"}
              </button>
            </div>
          </aside>

          <main className="p-6 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold">
                Campañas registradas
              </h3>

              <span className="text-sm text-zinc-500">
                Máximo 4 simultáneas
              </span>
            </div>

            {isLoading && (
              <p className="text-zinc-500">
                Cargando campañas...
              </p>
            )}

            {!isLoading && campaigns.length === 0 && (
              <div className="border border-dashed border-zinc-700 rounded-2xl p-10 text-center text-zinc-500">
                No existen campañas registradas.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onDisable={handleDisable}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function DateField({
  label,
  selected,
  onChange,
  minDate,
}) {
  return (
    <div>
      <label className="text-sm text-zinc-400">
        {label}
      </label>

      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        locale={es}
        minDate={minDate || undefined}
        placeholderText="Seleccionar fecha y hora"
        calendarClassName="nomenclatura-datepicker"
        popperClassName="nomenclatura-datepicker-popper"
        wrapperClassName="w-full mt-2"
        className={inputClass}
      />
    </div>
  )
}

function CampaignCard({ campaign, onDisable }) {
  return (
    <article className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-bold text-lg">
            {campaign.name}
          </h4>

          <p className="text-zinc-500 text-sm mt-1">
            {campaign.code}
          </p>
        </div>

        <span
          className={`
            text-xs px-2 py-1 rounded-full shrink-0
            ${
              campaign.is_active
                ? "bg-green-500/20 text-green-400"
                : "bg-zinc-800 text-zinc-500"
            }
          `}
        >
          {campaign.is_active ? "Activa" : "Inactiva"}
        </span>
      </div>

      <div className="mt-5 space-y-2 text-sm text-zinc-400">
        <p>
          País:
          <span className="text-white ml-2">
            {campaign.country}
          </span>
        </p>

        <p>
          Inicio:
          <span className="text-white ml-2">
            {formatDateTime(campaign.start_at)}
          </span>
        </p>

        <p>
          Término:
          <span className="text-white ml-2">
            {formatDateTime(campaign.end_at)}
          </span>
        </p>
      </div>

      {campaign.is_active && (
        <button
          onClick={() => onDisable(campaign.id)}
          className="mt-5 text-sm text-red-400 hover:text-red-300 transition"
        >
          Desactivar campaña
        </button>
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
  w-full
  bg-zinc-950
  border border-zinc-800
  rounded-xl
  px-4 py-3
  text-white
  outline-none
  focus:border-zinc-600
`