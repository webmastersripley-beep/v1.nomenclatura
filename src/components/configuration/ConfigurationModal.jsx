import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  saveUserPreferences,
} from "@/services/preferencesService"
import {
  uploadBackgroundImage,
} from "@/services/backgroundService"
import {
  useUserStore,
} from "@/store/useUserStore"
import {
  useNomenclaturaStore,
} from "@/store/useNomenclaturaStore"
import {
  validateConfiguration,
} from "@/utils/validateConfiguration"
import {
  buildFinalName,
} from "@/utils/buildFinalName"

export default function ConfigurationModal({
  onClose,
}) {

  const preferences =
    useUserStore(
      (state) => state.preferences
    )
  const user =
    useUserStore(
      (state) => state.user
    )
  const setPreferences =
    useUserStore(
      (state) => state.setPreferences
    )
  const recomputeFinalNames =
    useNomenclaturaStore(
      (state) => state.recomputeFinalNames
    )
  const setDefaultConfig =
    useNomenclaturaStore(
      (state) => state.setDefaultConfig
    )

  const [themePreset, setThemePreset] =
    useState(preferences.theme_preset || "midnight")
  const [backgroundType, setBackgroundType] =
    useState(preferences.background_type || "gradient")
  const [enableBlobs, setEnableBlobs] =
    useState(preferences.enable_blobs ?? true)
  const [descriptorMode, setDescriptorMode] =
    useState(preferences.descriptor_mode || "category")
  const [backgroundImageUrl, setBackgroundImageUrl] =
    useState(preferences.background_image_url || "")
  const [backgroundOpacity, setBackgroundOpacity] =
    useState(preferences.background_opacity ?? 0.15)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const previewName = useMemo(
    () =>
      buildFinalName(
        {
          piece: "grupo-1",
          format: "desk",
          campaign: "cyb",
          category: "calefaccion",
          brand: "bosch",
          date: "170526",
          country: "cl",
        },
        descriptorMode
      ),
    [descriptorMode]
  )

  const handleUploadBackground = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    try {
      setIsUploading(true)
      const publicUrl = await uploadBackgroundImage(
        file,
        user?.id || "anonimo"
      )

      setBackgroundImageUrl(publicUrl)

      if (backgroundType === "gradient") {
        setBackgroundType("mixed")
      }

      toast.success("Fondo subido")
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error subiendo fondo")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleSave = async () => {
    const payload = {
      app_user_id:
        user?.id,

      default_country:
        preferences.default_country,

      default_campaign:
        preferences.default_campaign,

      download_mode:
        preferences.download_mode,

      use_active_campaigns:
        preferences.use_active_campaigns,

      theme_preset:
        themePreset,

      background_type:
        backgroundType,

      enable_blobs:
        enableBlobs,

      descriptor_mode:
        descriptorMode,

      background_image_url:
        backgroundImageUrl.trim(),

      background_opacity:
        Number(backgroundOpacity),
    }

    const errors =
      validateConfiguration(payload)

    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }

    try {
      setIsSaving(true)
      const savedPreferences =
        await saveUserPreferences(payload)

      if (savedPreferences) {
        setPreferences(savedPreferences)
        setDefaultConfig({
          country: savedPreferences.default_country,
          campaign: savedPreferences.default_campaign,
          descriptorMode: savedPreferences.descriptor_mode || "category",
        })
      }

      recomputeFinalNames(descriptorMode)

      toast.success("Configuración guardada")
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(error.message || "Error guardando configuración")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="
      fixed inset-0
      bg-black/80
      flex items-center justify-center
      z-[120]
      p-3 sm:p-4
    ">

      <div className="
        w-full max-w-6xl
        max-h-[92vh]
        flex flex-col
        bg-zinc-900
        border border-zinc-800
        rounded-3xl
        overflow-hidden
      ">

        <div className="
          flex items-center justify-between
          px-5 sm:px-6 py-4
          border-b border-zinc-800
        ">

          <div>
            <h2 className="text-2xl font-bold">
              Configuración
            </h2>
            <p className="text-zinc-400 text-sm mt-1">
              Apariencia a la izquierda, nomenclatura a la derecha.
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
            "
          >
            ×
          </button>
        </div>

        <div className="
          flex-1 overflow-y-auto
          p-4 sm:p-5
          grid grid-cols-1
          xl:grid-cols-[320px_minmax(0,1fr)]
          gap-4
        ">

          <aside className="
            bg-zinc-950
            border border-zinc-800
            rounded-3xl
            p-4
          ">
            <SectionTitle
              title="Apariencia"
              subtitle="Tema, fondo y atmósfera visual."
            />

            <div className="space-y-4">
              <FieldLabel label="Tema visual">
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      isActive={themePreset === theme.id}
                      onClick={() => setThemePreset(theme.id)}
                    />
                  ))}
                </div>
              </FieldLabel>

              <FieldLabel label="Tipo de fondo">
                <select
                  value={backgroundType}
                  onChange={(event) =>
                    setBackgroundType(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="gradient">
                    Solo gradiente
                  </option>
                  <option value="image">
                    Solo imagen
                  </option>
                  <option value="mixed">
                    Gradiente + imagen
                  </option>
                </select>
              </FieldLabel>

              <FieldLabel label="Imagen de fondo">
                <div className="space-y-2">
                  <input
                    value={backgroundImageUrl}
                    onChange={(event) =>
                      setBackgroundImageUrl(event.target.value)
                    }
                    placeholder="https://..."
                    className={inputClass}
                  />

                  <label className="
                    flex items-center justify-center
                    rounded-xl border border-dashed border-zinc-700
                    bg-zinc-900 px-4 py-3 text-sm
                    text-zinc-300 hover:border-zinc-500
                    cursor-pointer transition
                  ">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBackground}
                      className="hidden"
                    />
                    {isUploading
                      ? "Subiendo fondo..."
                      : "Subir imagen real"}
                  </label>
                </div>
              </FieldLabel>

              <FieldLabel label={`Opacidad imagen · ${backgroundOpacity}`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={backgroundOpacity}
                  onChange={(event) =>
                    setBackgroundOpacity(Number(event.target.value))
                  }
                  className="w-full"
                />
              </FieldLabel>

              <CheckOption
                checked={enableBlobs}
                onChange={() => setEnableBlobs(!enableBlobs)}
                label="Activar blobs animados"
              />
            </div>
          </aside>

          <main className="
            bg-zinc-950
            border border-zinc-800
            rounded-3xl
            overflow-hidden
            grid grid-cols-1
            lg:grid-cols-[minmax(0,1fr)_320px]
          ">
            <section className="relative min-h-[360px]">
              <ThemePreview
                theme={themePreset}
                enableBlobs={enableBlobs}
                backgroundType={backgroundType}
                backgroundImageUrl={backgroundImageUrl}
                backgroundOpacity={backgroundOpacity}
              />

              <div className="relative z-20 p-5 sm:p-7">
                <span className="
                  inline-flex px-3 py-1 rounded-full
                  bg-white/10 text-white/80 text-xs
                  backdrop-blur-sm
                ">
                  Vista previa
                </span>

                <h2 className="mt-4 text-4xl sm:text-5xl font-bold leading-tight">
                  Nomenclaturas
                </h2>

                <p className="mt-3 text-zinc-300 max-w-md">
                  El fondo se ve aquí exactamente como respirará en la app.
                </p>

                <div className="
                  mt-6 bg-black/35 border border-white/10
                  backdrop-blur-xl rounded-2xl p-4
                  max-w-xl
                ">
                  <p className="text-xs text-zinc-400 mb-2">
                    Nombre final de ejemplo
                  </p>
                  <p className="text-sm sm:text-base break-all">
                    {previewName}
                  </p>
                </div>
              </div>
            </section>

            <section className="
              border-t lg:border-t-0 lg:border-l
              border-zinc-800
              p-4 sm:p-5
            ">
              <SectionTitle
                title="Nomenclatura"
                subtitle="Qué descriptor entra al nombre final."
              />

              <div className="space-y-3">
                {descriptorModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setDescriptorMode(mode.id)}
                    className={`
                      w-full text-left rounded-2xl border p-4 transition
                      ${
                        descriptorMode === mode.id
                          ? "border-fuchsia-500 bg-fuchsia-500/10"
                          : "border-white/10 bg-black/20 hover:border-white/20"
                      }
                    `}
                  >
                    <p className="font-medium">
                      {mode.name}
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">
                      {mode.example}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>

        <div className="
          shrink-0 flex justify-end gap-3
          px-5 sm:px-6 py-4
          border-t border-zinc-800 bg-zinc-950/60
        ">
          <button
            onClick={onClose}
            className="
              px-4 py-3 rounded-xl
              bg-zinc-800 hover:bg-zinc-700 transition
            "
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              px-5 py-3 rounded-xl font-medium transition
              ${
                isSaving
                  ? "bg-zinc-700 text-zinc-400"
                  : "bg-white text-black hover:opacity-90"
              }
            `}
          >
            {isSaving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ThemePreview({
  theme,
  enableBlobs,
  backgroundType,
  backgroundImageUrl,
  backgroundOpacity,
}) {
  const themeClass =
    themeMap[theme] || themeMap.midnight

  return (
    <>
      <div className={`absolute inset-0 ${themeClass}`} />

      {(backgroundType === "image" || backgroundType === "mixed") &&
        backgroundImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
              opacity: backgroundOpacity,
            }}
          />
        )}

      {enableBlobs && (
        <>
          <div className="
            absolute top-[-100px] left-[-100px]
            w-[300px] h-[300px]
            bg-fuchsia-500/30 blur-3xl rounded-full
          " />
          <div className="
            absolute bottom-[-120px] right-[-120px]
            w-[340px] h-[340px]
            bg-cyan-500/20 blur-3xl rounded-full
          " />
        </>
      )}
    </>
  )
}

function ThemeCard({
  theme,
  isActive,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden border h-20 transition
        ${isActive ? "border-fuchsia-500" : "border-zinc-800"}
      `}
    >
      <div className={`absolute inset-0 ${theme.className}`} />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative z-10 p-3 flex items-end h-full">
        <span className="text-sm font-medium text-white">
          {theme.name}
        </span>
      </div>
    </button>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h3 className="font-bold text-lg">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 mt-1">
        {subtitle}
      </p>
    </div>
  )
}

function FieldLabel({
  label,
  children,
}) {
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
  checked,
  onChange,
}) {
  return (
    <label className="
      flex items-center gap-3 rounded-xl
      border border-zinc-800 bg-zinc-900
      px-4 py-3 text-sm text-zinc-300
    ">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-fuchsia-500"
      />
      <span>{label}</span>
    </label>
  )
}

const themes = [
  {
    id: "midnight",
    name: "Midnight",
    className:
      "bg-gradient-to-br from-zinc-950 via-black to-zinc-900",
  },
  {
    id: "cyber",
    name: "Cyber",
    className:
      "bg-gradient-to-br from-fuchsia-950 via-zinc-950 to-cyan-950",
  },
  {
    id: "ocean",
    name: "Ocean",
    className:
      "bg-gradient-to-br from-cyan-950 via-blue-950 to-zinc-950",
  },
  {
    id: "sunset",
    name: "Sunset",
    className:
      "bg-gradient-to-br from-orange-950 via-fuchsia-950 to-black",
  },
  {
    id: "luxury",
    name: "Luxury",
    className:
      "bg-gradient-to-br from-yellow-950 via-black to-zinc-950",
  },
]

const descriptorModes = [
  {
    id: "category",
    name: "Solo categoría",
    example: "calefaccion",
  },
  {
    id: "brand-category",
    name: "Marca + categoría",
    example: "bosch-calefaccion",
  },
  {
    id: "category-brand",
    name: "Categoría + marca",
    example: "calefaccion-bosch",
  },
  {
    id: "brand",
    name: "Solo marca",
    example: "bosch",
  },
]

const themeMap = {
  midnight:
    "bg-gradient-to-br from-zinc-950 via-black to-zinc-900",
  cyber:
    "bg-gradient-to-br from-fuchsia-950 via-zinc-950 to-cyan-950",
  ocean:
    "bg-gradient-to-br from-cyan-950 via-blue-950 to-zinc-950",
  sunset:
    "bg-gradient-to-br from-orange-950 via-fuchsia-950 to-black",
  luxury:
    "bg-gradient-to-br from-yellow-950 via-black to-zinc-950",
}

const inputClass = `
  w-full
  bg-zinc-900
  border border-zinc-800
  rounded-xl
  px-4 py-3
  text-white
  outline-none
  focus:border-zinc-600
`
