import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"

import {
  getUserPreferences,
  saveUserPreferences,
} from "@/services/preferencesService"
import { findUserByName } from "@/services/userService"
import {
  defaultPreferences,
  useUserStore,
} from "@/store/useUserStore"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"

import CampaignManager from "@/components/campaigns/CampaignManager"
import ConfigurationModal from "@/components/configuration/ConfigurationModal"
import HistoryModal from "@/components/history/HistoryModal"

export default function UserLogin() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const logout = useUserStore((state) => state.logout)
  const setPreferences = useUserStore((state) => state.setPreferences)
  const setDefaultConfig = useNomenclaturaStore((state) => state.setDefaultConfig)
  const recomputeFinalNames = useNomenclaturaStore((state) => state.recomputeFinalNames)

  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isCampaignManagerOpen, setIsCampaignManagerOpen] = useState(false)
  const [isConfigurationOpen, setIsConfigurationOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogin = async () => {
    if (!name.trim()) {
      toast.error("Ingresa un usuario")
      return
    }

    try {
      setIsLoading(true)

      const foundUser = await findUserByName(name)

      if (!foundUser) {
        toast.error("Usuario no encontrado")
        return
      }

      setUser(foundUser)

      const userPreferences =
        await getUserPreferences(foundUser.id)

      const activePreferences = userPreferences || defaultPreferences

      setPreferences(activePreferences)
      setDefaultConfig({
        country: activePreferences.default_country,
        campaign: activePreferences.default_campaign,
        descriptorMode: activePreferences.descriptor_mode || "category",
      })
      recomputeFinalNames(activePreferences.descriptor_mode || "category")

      toast.success(`Bienvenido ${foundUser.name}`)
      setName("")
    } catch (error) {
      console.error(error)
      toast.error("Error iniciando sesión")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="
        flex items-center gap-2
        rounded-2xl border border-white/10
        bg-black/20 p-2
        backdrop-blur-xl
      ">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleLogin()
            }
          }}
          placeholder="Usuario"
          className="
            min-w-[180px]
            bg-transparent
            px-3 py-2
            text-sm text-white
            outline-none
            placeholder:text-zinc-500
          "
        />

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`
            rounded-xl px-4 py-2
            text-sm font-medium transition
            ${
              isLoading
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-white text-black hover:opacity-90"
            }
          `}
        >
          {isLoading ? "Entrando..." : "Ingresar"}
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="
            flex items-center gap-3
            rounded-2xl border border-white/10
            bg-black/20 px-3 py-2
            backdrop-blur-xl transition
            hover:bg-white/10
          "
        >
          <span className="
            flex h-9 w-9 items-center justify-center
            rounded-full bg-white text-sm font-semibold text-black
          ">
            {getInitials(user.name)}
          </span>

          <span className="text-sm font-medium text-white">
            {user.name}
          </span>

          <ChevronDown
            size={16}
            className={`
              text-zinc-400 transition
              ${isMenuOpen ? "rotate-180" : ""}
            `}
          />
        </button>

        {isMenuOpen && (
          <div
            className="
              absolute right-0 mt-2 w-60
              overflow-hidden rounded-2xl
              border border-zinc-800 bg-zinc-900
              shadow-2xl z-50
            "
          >
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Usuario activo
              </p>
            </div>

            <MenuButton
              onClick={() => {
                setIsPreferencesOpen(true)
                setIsMenuOpen(false)
              }}
            >
              Preferencias
            </MenuButton>

            <MenuButton
              onClick={() => {
                setIsCampaignManagerOpen(true)
                setIsMenuOpen(false)
              }}
            >
              Gestión campañas
            </MenuButton>

            <MenuButton
              onClick={() => {
                setIsConfigurationOpen(true)
                setIsMenuOpen(false)
              }}
            >
              Configuración
            </MenuButton>

            <MenuButton
              onClick={() => {
                setIsHistoryOpen(true)
                setIsMenuOpen(false)
              }}
            >
              Historial
            </MenuButton>

            <MenuButton
              danger
              onClick={() => {
                logout()
                setDefaultConfig({
                  country: defaultPreferences.default_country,
                  campaign: defaultPreferences.default_campaign,
                  descriptorMode: "category",
                })
                recomputeFinalNames("category")
                setIsMenuOpen(false)
                toast.success("Sesión cerrada")
              }}
            >
              Cerrar sesión
            </MenuButton>
          </div>
        )}
      </div>

      {isPreferencesOpen && (
        <PreferencesModal
          onClose={() => setIsPreferencesOpen(false)}
        />
      )}

      {isCampaignManagerOpen && (
        <CampaignManager
          onClose={() => setIsCampaignManagerOpen(false)}
        />
      )}

      {isConfigurationOpen && (
        <ConfigurationModal
          onClose={() => setIsConfigurationOpen(false)}
        />
      )}

      {isHistoryOpen && (
        <HistoryModal
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </>
  )
}

function PreferencesModal({ onClose }) {
  const user = useUserStore((state) => state.user)
  const preferences = useUserStore((state) => state.preferences)
  const setPreferences = useUserStore((state) => state.setPreferences)
  const setDefaultConfig = useNomenclaturaStore((state) => state.setDefaultConfig)

  const [defaultCountry, setDefaultCountry] =
    useState(preferences.default_country || "cl")
  const [defaultCampaign, setDefaultCampaign] =
    useState(preferences.default_campaign || "hg")
  const [downloadMode, setDownloadMode] =
    useState(preferences.download_mode || "por-familia")
  const [useActiveCampaigns, setUseActiveCampaigns] =
    useState(preferences.use_active_campaigns ?? true)
  const [isSaving, setIsSaving] =
    useState(false)

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true)

      const savedPreferences =
        await saveUserPreferences({
          app_user_id: user.id,
          default_country: defaultCountry,
          default_campaign: defaultCampaign,
          download_mode: downloadMode,
          use_active_campaigns: useActiveCampaigns,
        })

      if (savedPreferences) {
        setPreferences(savedPreferences)
        setDefaultConfig({
          country: savedPreferences.default_country,
          campaign: savedPreferences.default_campaign,
        })
      }

      toast.success("Preferencias guardadas")
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error guardando preferencias")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="
        fixed inset-0
        bg-black/75
        flex items-center justify-center
        z-[100]
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-4xl
          bg-zinc-900
          border border-zinc-800
          rounded-3xl
          shadow-2xl
          overflow-hidden
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="
          flex items-center justify-between
          px-6 py-5
          border-b border-zinc-800
        ">
          <div>
            <h2 className="text-2xl font-bold">
              Preferencias
            </h2>
            <p className="text-zinc-400 mt-1 text-sm">
              Configura campañas, descargas y valores por defecto.
            </p>
          </div>

          <button
            onClick={onClose}
            className="
              w-10 h-10
              rounded-xl
              bg-zinc-800
              hover:bg-zinc-700
              transition
              text-xl
            "
          >
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PreferenceCard
              title="Campañas"
              description="Reglas para campañas activas y valores por defecto."
            >
              <FieldLabel label="País predeterminado">
                <select
                  value={defaultCountry}
                  onChange={(event) =>
                    setDefaultCountry(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="cl">Chile</option>
                  <option value="pe">Perú</option>
                  <option value="co">Colombia</option>
                </select>
              </FieldLabel>

              <CheckOption
                checked={useActiveCampaigns}
                onChange={() =>
                  setUseActiveCampaigns(!useActiveCampaigns)
                }
                label="Usar campañas activas por fecha y hora"
              />

              <FieldLabel label="Campaña por defecto">
                <input
                  value={defaultCampaign}
                  onChange={(event) =>
                    setDefaultCampaign(event.target.value.toLowerCase())
                  }
                  className={inputClass}
                />
              </FieldLabel>
            </PreferenceCard>

            <PreferenceCard
              title="Modo de descarga"
              description="Define si se descarga directo o como ZIP."
            >
              <FieldLabel label="Tipo de descarga">
                <select
                  value={downloadMode}
                  onChange={(event) =>
                    setDownloadMode(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="por-familia">
                    Por carpeta de familia
                  </option>
                  <option value="carpeta-unica">
                    Todas dentro de una carpeta
                  </option>
                  <option value="directo">
                    Imágenes directas sin ZIP
                  </option>
                  <option value="por-formato">
                    Imágenes separadas por formato
                  </option>
                </select>
              </FieldLabel>
            </PreferenceCard>
          </div>
        </div>

        <div className="
          flex justify-end gap-3
          px-6 py-5
          border-t border-zinc-800
          bg-zinc-950/60
        ">
          <button
            onClick={onClose}
            className="
              px-4 py-3
              rounded-xl
              bg-zinc-800
              hover:bg-zinc-700
              transition
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleSavePreferences}
            disabled={isSaving}
            className={`
              px-5 py-3
              rounded-xl
              font-medium
              transition
              ${
                isSaving
                  ? "bg-zinc-700 text-zinc-400"
                  : "bg-white text-black hover:opacity-90"
              }
            `}
          >
            {isSaving
              ? "Guardando..."
              : "Guardar preferencias"}
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuButton({
  children,
  danger = false,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left px-4 py-3 text-sm transition
        ${
          danger
            ? "text-red-400 hover:bg-red-500/10"
            : "hover:bg-zinc-800"
        }
      `}
    >
      {children}
    </button>
  )
}

function PreferenceCard({
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`
        bg-zinc-950 border border-zinc-800 rounded-2xl p-5
        ${className}
      `}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-white">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          {description}
        </p>
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}

function FieldLabel({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-400">
        {label}
      </span>

      <div className="mt-2">
        {children}
      </div>
    </label>
  )
}

function CheckOption({
  label,
  checked = false,
  onChange,
}) {
  return (
    <label
      className="
        flex items-center gap-3 rounded-xl border border-zinc-800
        bg-zinc-900 px-4 py-3 text-sm text-zinc-300
      "
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-fuchsia-500"
      />

      <span>
        {label}
      </span>
    </label>
  )
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

const inputClass = `
  w-full bg-zinc-900 border border-zinc-800 rounded-xl
  px-4 py-3 text-white outline-none focus:border-zinc-600
`
