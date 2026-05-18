import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { getUserPreferences, saveUserPreferences } from "@/services/preferencesService"
import { findUserByName } from "@/services/userService"
import { useUserStore } from "@/store/useUserStore"
import CampaignManager from "@/components/campaigns/CampaignManager"
import ConfigurationModal from "@/components/configuration/ConfigurationModal"
import HistoryModal from "@/components/history/HistoryModal"
export default function UserLogin() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const logout = useUserStore((state) => state.logout)
  const setPreferences = useUserStore((state) => state.setPreferences)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isCampaignManagerOpen, setIsCampaignManagerOpen ] = useState(false)
  const [isConfigurationOpen, setIsConfigurationOpen ] = useState(false)
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
        await getUserPreferences(
          foundUser.id
        )

      if (userPreferences) {

        setPreferences(
          userPreferences
        )
      }
      toast.success(`Bienvenido ${foundUser.name}`)
      setName("")
    } catch (error) {
      console.error(error)
      toast.error("Error iniciando sesiÃ³n")
    } finally {
      setIsLoading(false)
    }
  }
  

  if (!user) {
    return (
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Usuario"
          className="
            bg-zinc-900 border border-zinc-800 rounded-xl
            px-4 py-2 text-sm text-white outline-none focus:border-zinc-500
          "
        />

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-xl transition font-medium
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
            flex items-center gap-2 px-4 py-2 rounded-xl
            bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition
          "
        >
          <span className="text-sm text-white">
            {user.name}
          </span>

          <span className="text-zinc-500 text-xs">
            â–¼
          </span>
        </button>

        {isMenuOpen && (
          <div
            className="
              absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800
              rounded-2xl shadow-2xl overflow-hidden z-50
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

            <button
              onClick={() => {
                setIsPreferencesOpen(true)
                setIsMenuOpen(false)
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition"
            >
              Preferencias
            </button>

            <button
              onClick={() => {

                setIsCampaignManagerOpen(
                  true
                )

                setIsMenuOpen(false)
              }}
              className="
                w-full
                text-left
                px-4 py-3
                text-sm
                hover:bg-zinc-800
                transition
              "
            >
              GestiÃ³n campaÃ±as
            </button>

            <button
              onClick={() => {

                setIsConfigurationOpen(
                  true
                )

                setIsMenuOpen(false)
              }}
              className="
                w-full
                text-left
                px-4 py-3
                text-sm
                hover:bg-zinc-800
                transition
              "
            >
              Configuración
            </button>

            <button
              onClick={() => {
                setIsHistoryOpen(true)
                setIsMenuOpen(false)
              }}
              className="
                w-full
                text-left
                px-4 py-3
                text-sm
                hover:bg-zinc-800
                transition
              "
            >
              Historial
            </button>

            <button
              onClick={() => {
                logout()
                setIsMenuOpen(false)
                toast.success("SesiÃ³n cerrada")
              }}
              className="
                w-full text-left px-4 py-3 text-sm text-red-400
                hover:bg-red-500/10 transition
              "
            >
              Cerrar sesiÃ³n
            </button>
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
          onClose={() =>
            setIsCampaignManagerOpen(
              false
            )
          }
        />
      )}
      {isConfigurationOpen && (

        <ConfigurationModal
          onClose={() =>
            setIsConfigurationOpen(
              false
            )
          }
        />
      )}
      {isHistoryOpen && (
        <HistoryModal
          onClose={() =>
            setIsHistoryOpen(
              false
            )
          }
        />
      )}
    </>
  )
}

function PreferencesModal({ onClose }) {

  const user =
    useUserStore((state) => state.user)

  const preferences =
    useUserStore(
      (state) => state.preferences
    )

  const setPreferences =
    useUserStore(
      (state) => state.setPreferences
    )

  const [
    defaultCountry,
    setDefaultCountry,
  ] = useState(
    preferences.default_country || "cl"
  )

  const [
    defaultCampaign,
    setDefaultCampaign,
  ] = useState(
    preferences.default_campaign || "hg"
  )

  const [
    downloadMode,
    setDownloadMode,
  ] = useState(
    preferences.download_mode ||
    "por-familia"
  )

  const [
    useActiveCampaigns,
    setUseActiveCampaigns,
  ] = useState(
    preferences.use_active_campaigns ?? true
  )

  const [isSaving, setIsSaving] =
    useState(false)

  const handleSavePreferences =
    async () => {

      try {

        setIsSaving(true)

        const payload = {
          app_user_id:
            user.id,

          default_country:
            defaultCountry,

          default_campaign:
            defaultCampaign,

          download_mode:
            downloadMode,

          use_active_campaigns:
            useActiveCampaigns,
        }

        await saveUserPreferences(
          payload
        )

        setPreferences(payload)

        toast.success(
          "Preferencias guardadas"
        )

        onClose()

      } catch (error) {

        console.error(error)

        toast.error(
          "Error guardando preferencias"
        )

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

            <p className="
              text-zinc-400
              mt-1
              text-sm
            ">
              Configura reglas personales
              para campaÃ±as,
              descargas y validaciones.
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
            âœ•
          </button>

        </div>

        <div className="
          max-h-[70vh]
          overflow-y-auto
          p-6
        ">

          <div className="
            grid grid-cols-1
            lg:grid-cols-2
            gap-5
          ">

            <PreferenceCard
              title="CampaÃ±as"
              description="
                Reglas para campaÃ±as activas
                y valores por defecto.
              "
            >

              <FieldLabel
                label="
                  PaÃ­s predeterminado
                "
              >

                <select
                  value={defaultCountry}
                  onChange={(event) =>
                    setDefaultCountry(
                      event.target.value
                    )
                  }
                  className={inputClass}
                >

                  <option value="cl">
                    Chile
                  </option>

                  <option value="pe">
                    PerÃº
                  </option>


                </select>

              </FieldLabel>

              <CheckOption
                checked={
                  useActiveCampaigns
                }
                onChange={() =>
                  setUseActiveCampaigns(
                    !useActiveCampaigns
                  )
                }
                label="
                  Usar campaÃ±as activas
                  por fecha y hora
                "
              />

              <FieldLabel
                label="
                  CampaÃ±a por defecto
                "
              >

                <input
                  value={defaultCampaign}
                  onChange={(event) =>
                    setDefaultCampaign(
                      event.target.value
                    )
                  }
                  className={inputClass}
                />

              </FieldLabel>

            </PreferenceCard>

            <PreferenceCard
              title="
                Modo de descarga
              "
              description="
                Define cÃ³mo se organizarÃ¡
                el ZIP final.
              "
            >

              <FieldLabel
                label="
                  Estructura ZIP
                "
              >

                <select
                  value={downloadMode}
                  onChange={(event) =>
                    setDownloadMode(
                      event.target.value
                    )
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
                    ImÃ¡genes directas en el ZIP
                  </option>
                  <option value="por-formato">
                    ImÃ¡genes separadas por formato
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
            onClick={
              handleSavePreferences
            }
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

const inputClass = `
  w-full bg-zinc-900 border border-zinc-800 rounded-xl
  px-4 py-3 text-white outline-none focus:border-zinc-600
`
