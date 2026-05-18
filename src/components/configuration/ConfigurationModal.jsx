import { useState } from "react"
import { toast } from "sonner"
import {
  saveUserPreferences,
} from "@/services/preferencesService"
import {
  useUserStore,
} from "@/store/useUserStore"

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

  const [
    themePreset,
    setThemePreset,
  ] = useState(
    preferences.theme_preset
    || "midnight"
  )

  const [
    backgroundType,
    setBackgroundType,
  ] = useState(
    preferences.background_type
    || "gradient"
  )

  const [
    enableBlobs,
    setEnableBlobs,
  ] = useState(
    preferences.enable_blobs
    ?? true
  )

  const [
    descriptorMode,
    setDescriptorMode,
  ] = useState(
    preferences.descriptor_mode
    || "category"
  )

  const [
    backgroundImageUrl,
    setBackgroundImageUrl,
  ] = useState(
    preferences.background_image_url
    || ""
  )

  const [
    backgroundOpacity,
    setBackgroundOpacity,
  ] = useState(
    preferences.background_opacity
    || 0.15
  )

  const handleSave =
    async () => {

        try {

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
            backgroundImageUrl,

            background_opacity:
            backgroundOpacity,
        }

        await saveUserPreferences(
            payload
        )

        setPreferences({

            theme_preset:
            themePreset,

            background_type:
            backgroundType,

            enable_blobs:
            enableBlobs,

            descriptor_mode:
            descriptorMode,

            background_image_url:
            backgroundImageUrl,

            background_opacity:
            backgroundOpacity,
        })

        toast.success(
            "Configuración guardada"
        )

        onClose()

        } catch (error) {

        console.error(error)

        toast.error(
            "Error guardando configuración"
        )
        }
  }

  return (
    <div className="
      fixed inset-0
      bg-black/80
      flex items-center justify-center
      z-[120]
      p-4
    ">

      <div className="
        w-full max-w-5xl h-[88vh]
        flex flex-col
        bg-zinc-900
        border border-zinc-800
        rounded-3xl
        overflow-hidden
      ">

        <div className="
          flex items-center justify-between
          px-6 py-5
          border-b border-zinc-800
        ">

          <div>

            <h2 className="
              text-2xl font-bold
            ">
              Configuración
            </h2>

            <p className="
              text-zinc-400
              text-sm
              mt-1
            ">
              Apariencia y reglas
              globales del sistema.
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
            ✕
          </button>

        </div>

        <div className="
            flex-1
            overflow-y-auto
            p-5
            grid grid-cols-1
            lg:grid-cols-[340px_1fr]
            gap-5
        ">

          <aside className="
            bg-zinc-950
            border border-zinc-800
            rounded-3xl
            p-5
          ">

            <h3 className="
              font-bold text-lg
              mb-5
            ">
              Apariencia
            </h3>

            <div className="
              space-y-5
            ">

              <FieldLabel
                label="Tema visual"
              >

                <div className="
                  grid grid-cols-2
                  gap-3
                ">

                  {themes.map(
                    (theme) => (

                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isActive={
                          themePreset ===
                          theme.id
                        }
                        onClick={() =>
                          setThemePreset(
                            theme.id
                          )
                        }
                      />
                    )
                  )}

                </div>

              </FieldLabel>

              <FieldLabel
                label="
                  Tipo de fondo
                "
              >

                <select
                  value={backgroundType}
                  onChange={(event) =>
                    setBackgroundType(
                      event.target.value
                    )
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

              <FieldLabel
                label="
                  Imagen fondo URL
                "
              >

                <input
                  value={
                    backgroundImageUrl
                  }
                  onChange={(event) =>
                    setBackgroundImageUrl(
                      event.target.value
                    )
                  }
                  placeholder="
                    https://...
                  "
                  className={inputClass}
                />

              </FieldLabel>

              <FieldLabel
                label="
                  Opacidad imagen
                "
              >

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    backgroundOpacity
                  }
                  onChange={(event) =>
                    setBackgroundOpacity(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="w-full"
                />

              </FieldLabel>

              <CheckOption
                checked={enableBlobs}
                onChange={() =>
                  setEnableBlobs(
                    !enableBlobs
                  )
                }
                label="
                  Activar blobs animados
                "
              />

            </div>

          </aside>

          <main className="
            bg-zinc-950
            border border-zinc-800
            rounded-3xl
            overflow-hidden
            relative
            min-h-[420px]
          ">

            <ThemePreview
              theme={themePreset}
              enableBlobs={
                enableBlobs
              }
              backgroundType={
                backgroundType
              }
              backgroundImageUrl={
                backgroundImageUrl
              }
              backgroundOpacity={
                backgroundOpacity
              }
            />

            <div className="
              relative z-20
              p-8
            ">

              <div className="
                max-w-lg
              ">

                <span className="
                  inline-flex
                  px-3 py-1
                  rounded-full
                  bg-white/10
                  text-white/80
                  text-xs
                  backdrop-blur-sm
                ">
                  Vista previa
                </span>

                <h2 className="
                  mt-5
                  text-5xl
                  font-bold
                  leading-tight
                ">
                  Nomenclaturas
                </h2>

                <p className="
                  mt-4
                  text-zinc-300
                  text-lg
                ">
                  Sistema inteligente
                  de nomenclaturas
                  retail.
                </p>

              </div>

              <div className="
                mt-10
                bg-black/30
                border border-white/10
                backdrop-blur-xl
                rounded-3xl
                p-6
                max-w-md
              ">

                <h3 className="
                  font-bold text-lg
                ">
                  Descriptor nomenclatura
                </h3>

                <p className="
                  text-zinc-400
                  text-sm mt-1
                ">
                  Configura cómo se
                  construirá la categoría.
                </p>

                <div className="
                  mt-5
                  space-y-3
                ">

                  {descriptorModes.map(
                    (mode) => (

                      <button
                        key={mode.id}
                        onClick={() =>
                          setDescriptorMode(
                            mode.id
                          )
                        }
                        className={`
                          w-full
                          text-left
                          rounded-2xl
                          border
                          p-4
                          transition
                          ${
                            descriptorMode ===
                            mode.id
                              ? "border-fuchsia-500 bg-fuchsia-500/10"
                              : "border-white/10 bg-black/20 hover:border-white/20"
                          }
                        `}
                      >

                        <p className="
                          font-medium
                        ">
                          {mode.name}
                        </p>

                        <p className="
                          text-sm
                          text-zinc-400
                          mt-1
                        ">
                          {mode.example}
                        </p>

                      </button>
                    )
                  )}

                </div>

              </div>

            </div>

          </main>

        </div>

        <div className="
            shrink-0
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
            onClick={handleSave}
            className="
              px-5 py-3
              rounded-xl
              bg-white
              text-black
              font-medium
              hover:opacity-90
              transition
            "
          >
            Guardar configuración
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
    themeMap[theme]
    || themeMap.midnight

  return (
    <>

      <div className={`
        absolute inset-0
        ${themeClass}
      `} />

      {(backgroundType ===
        "image" ||
        backgroundType ===
        "mixed") &&
        backgroundImageUrl && (

        <div
          className="
            absolute inset-0
            bg-cover bg-center
          "
          style={{
            backgroundImage:
              `url(${backgroundImageUrl})`,
            opacity:
              backgroundOpacity,
          }}
        />
      )}

      {enableBlobs && (
        <>

          <div className="
            absolute
            top-[-100px]
            left-[-100px]
            w-[300px]
            h-[300px]
            bg-fuchsia-500/30
            blur-3xl
            rounded-full
          " />

          <div className="
            absolute
            bottom-[-120px]
            right-[-120px]
            w-[340px]
            h-[340px]
            bg-cyan-500/20
            blur-3xl
            rounded-full
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
        relative
        rounded-2xl
        overflow-hidden
        border
        h-28
        transition
        ${
          isActive
            ? "border-fuchsia-500"
            : "border-zinc-800"
        }
      `}
    >

      <div className={`
        absolute inset-0
        ${theme.className}
      `} />

      <div className="
        absolute inset-0
        bg-black/10
      " />

      <div className="
        relative z-10
        p-3
        flex items-end
        h-full
      ">

        <span className="
          text-sm
          font-medium
          text-white
        ">
          {theme.name}
        </span>

      </div>

    </button>
  )
}

function FieldLabel({
  label,
  children,
}) {

  return (
    <label className="
      block
    ">

      <span className="
        text-sm
        text-zinc-400
      ">
        {label}
      </span>

      <div className="
        mt-2
      ">
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
      flex items-center
      gap-3
      rounded-xl
      border border-zinc-800
      bg-zinc-900
      px-4 py-3
      text-sm text-zinc-300
    ">

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="
          accent-fuchsia-500
        "
      />

      <span>
        {label}
      </span>

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
    example:
      "zapatillas",
  },

  {
    id: "brand-category",
    name:
      "Marca + categoría",
    example:
      "adidas-zapatillas",
  },

  {
    id: "category-brand",
    name:
      "Categoría + marca",
    example:
      "zapatillas-adidas",
  },

  {
    id: "brand",
    name: "Solo marca",
    example:
      "adidas",
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