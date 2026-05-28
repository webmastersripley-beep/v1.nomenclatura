import { useMemo, useState } from "react"
import { toast } from "sonner"

import EditableFamilyTitle from "@/components/common/EditableFamilyTitle"
import ImageModal from "@/components/common/ImageModal"
import { analyzeImageWithGemini } from "@/services/geminiService"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import {
  buildWorldPiece,
  getWorldFamilyForComponentFamily,
  getWorldZipFolder,
  isWorldFamily,
  resolveWorldFromSignals,
} from "@/utils/worldRules"

const EMPTY_RESULTS = []

export default function EditStep({ onBack, onNext }) {
  const results = useNomenclaturaStore((state) => state.results) || EMPTY_RESULTS
  const updateResult = useNomenclaturaStore((state) => state.updateResult)
  const updateResultPatch = useNomenclaturaStore((state) => state.updateResultPatch)
  const renameFamily = useNomenclaturaStore((state) => state.renameFamily)
  const renameResultFamily = useNomenclaturaStore((state) => state.renameResultFamily)
  const defaultConfig = useNomenclaturaStore((state) => state.defaultConfig)

  const groupedFamilies = groupByPiece(results)
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [activeFamilyId, setActiveFamilyId] = useState(
    groupedFamilies[0]?.familyId || null
  )
  const [expandedFamilyIds, setExpandedFamilyIds] = useState(() => new Set())
  const [analyzingFamilyId, setAnalyzingFamilyId] = useState(null)
  const activeFamily =
    groupedFamilies.find((family) => family.familyId === activeFamilyId) ||
    groupedFamilies[0] ||
    null
  const imageList = useMemo(
    () => results
      .filter((item) => item.previewUrl)
      .map((item) => ({
        src: item.previewUrl,
        name: item.originalName,
      })),
    [results]
  )

  const updateFamilyField = (family, field, value) => {
    family.items.forEach((item) => {
      updateResult(item.id, field, value)
    })
  }

  const toggleFamilyExpanded = (familyId) => {
    setExpandedFamilyIds((current) => {
      const next = new Set(current)

      if (next.has(familyId)) {
        next.delete(familyId)
      } else {
        next.add(familyId)
      }

      return next
    })
  }

  const applyAiResultToFamily = (family, result) => {
    family.items.forEach((item) => {
      const patch = buildAiPatch(item, result)

      updateResultPatch(item.id, patch)
    })
  }

  const analyzeFamily = async (family) => {
    if (!family || analyzingFamilyId) return

    try {
      setAnalyzingFamilyId(family.familyId)

      const fileToAnalyze = family.items.find((item) => item.file)?.file

      if (!fileToAnalyze) {
        toast.error("No se encontro imagen para analizar.")
        return
      }

      const result = await analyzeImageWithGemini(fileToAnalyze)

      applyAiResultToFamily(family, result)
      toast.success("Familia analizada con IA")
    } catch (error) {
      console.error(error)
      toast.error("Error analizando imagen")
    } finally {
      setAnalyzingFamilyId(null)
    }
  }

  const analyzeAllFamilies = async () => {
    try {
      setIsBulkAnalyzing(true)

      for (const family of groupedFamilies) {
        const fileToAnalyze = family.items.find((item) => item.file)?.file

        if (!fileToAnalyze) continue

        try {
          const result = await analyzeImageWithGemini(fileToAnalyze)

          applyAiResultToFamily(family, result)
          await new Promise((resolve) => setTimeout(resolve, 1200))
        } catch (error) {
          console.error("Error familia:", family.piece, error)
        }
      }

      toast.success("Analisis IA completado")
    } catch (error) {
      console.error(error)
      toast.error("Error analisis masivo")
    } finally {
      setIsBulkAnalyzing(false)
    }
  }

  useKeyboardShortcuts([
    {
      key: "a",
      enabled: !selectedImage && Boolean(activeFamily),
      handler: () => analyzeFamily(activeFamily),
    },
    {
      key: "e",
      enabled: !selectedImage && Boolean(activeFamily),
      handler: () => toggleFamilyExpanded(activeFamily.familyId),
    },
  ])

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-2xl font-bold">Edicion de nomenclaturas</h2>

        <p className="text-zinc-400 mt-2 mb-6">
          Edita datos comunes por familia. Desglosa solo si necesitas cambiar formatos.
        </p>

        <div className="mb-6">
          <button
            onClick={analyzeAllFamilies}
            disabled={isBulkAnalyzing}
            className={`
              px-4 py-3 rounded-xl font-medium transition
              ${
                isBulkAnalyzing
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
              }
            `}
          >
            {isBulkAnalyzing
              ? "Analizando familias..."
              : "Analizar todas las familias"}
          </button>
        </div>

        <div className="space-y-4">
          {groupedFamilies.map((family) => (
            <FamilyCard
              key={family.familyId}
              family={family}
              defaultConfig={defaultConfig}
              updateResult={updateResult}
              updateFamilyField={updateFamilyField}
              updateResultPatch={updateResultPatch}
              onRenameFamily={(nextPiece) => {
                renameFamily(family.familyId, nextPiece)
                renameResultFamily(family.familyId, nextPiece)
              }}
              setSelectedImage={setSelectedImage}
              isActive={activeFamily?.familyId === family.familyId}
              isExpanded={expandedFamilyIds.has(family.familyId)}
              isAnalyzing={analyzingFamilyId === family.familyId}
              onFocusFamily={() => setActiveFamilyId(family.familyId)}
              onToggleExpanded={() => toggleFamilyExpanded(family.familyId)}
              onAnalyzeFamily={() => analyzeFamily(family)}
            />
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
          >
            Volver
          </button>

          <button
            onClick={onNext}
            className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:opacity-90 transition"
          >
            Continuar a descarga
          </button>
        </div>
      </div>

      <ImageModal
        image={selectedImage}
        images={imageList}
        onClose={() => setSelectedImage(null)}
        onImageChange={setSelectedImage}
      />
    </>
  )
}

function FamilyCard({
  family,
  defaultConfig,
  updateResult,
  updateFamilyField,
  updateResultPatch,
  onRenameFamily,
  setSelectedImage,
  isActive,
  isExpanded,
  isAnalyzing,
  onFocusFamily,
  onToggleExpanded,
  onAnalyzeFamily,
}) {
  const firstItem = family.items[0]
  const descriptorMode =
    firstItem.descriptorMode ||
    defaultConfig?.descriptorMode ||
    "category"
  const descriptorFields =
    getDescriptorFields(descriptorMode)
  const categorySuggestions = buildCategorySuggestions(firstItem)
  const applyCategorySuggestion = (value) => {
    family.items.forEach((item) => {
      updateResultPatch(item.id, {
        category: value,
      })
    })
  }

  const openImage = (item) => {
    setSelectedImage({
      src: item.previewUrl,
      name: item.originalName,
    })
  }

  return (
    <div
      tabIndex={0}
      onFocus={onFocusFamily}
      onMouseEnter={onFocusFamily}
      className={`rounded-2xl border bg-zinc-950 p-4 outline-none transition ${
        isActive
          ? "border-white/35 ring-2 ring-white/10"
          : "border-zinc-800 focus:border-white/25"
      }`}
    >
      <div className="grid grid-cols-[80px_1fr_auto] gap-4 items-start">
        {firstItem.previewUrl ? (
          <button
            type="button"
            onClick={() => openImage(firstItem)}
            className="block"
          >
            <img
              src={firstItem.previewUrl}
              alt={firstItem.originalName}
              className="w-20 h-20 object-cover rounded-xl bg-black"
            />
          </button>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-zinc-800" />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <EditableFamilyTitle
              piece={family.piece}
              onSave={onRenameFamily}
            />

            <span className="text-sm text-zinc-500">
              {family.items.length} pieza(s)
            </span>

            <div className="flex gap-2 flex-wrap">
              {family.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-1">
                  <span className="px-2 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300">
                    {item.format || "manual"}
                  </span>

                  <CompressionInfo item={item} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 md:grid-cols-3 xl:grid-cols-6">
            <Field
              label="Componente"
              value={firstItem.piece}
              onChange={onRenameFamily}
            />
            <Field
              label="Campana"
              value={firstItem.campaign}
              onChange={(value) => updateFamilyField(family, "campaign", value)}
            />
            {descriptorFields.map((field) => (
              <Field
                key={field}
                label={field === "brand" ? "Marca" : "Categoria"}
                value={field === "brand" ? firstItem.brand : firstItem.category}
                onChange={(value) => updateFamilyField(family, field, value)}
              />
            ))}
            <Field
              label="Fecha"
              value={firstItem.date}
              onChange={(value) => updateFamilyField(family, "date", value)}
            />
            <Field
              label="Pais"
              value={firstItem.country}
              onChange={(value) => updateFamilyField(family, "country", value)}
            />
          </div>

          <div className="mt-4 bg-black rounded-xl border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500 mb-2">Nombres generados</p>

            <div className="space-y-1">
              {family.items.map((item) => (
                <p key={item.id} className="text-sm text-white break-all">
                  {item.finalName}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
            <p className="text-xs text-zinc-500 mb-2">Metadata IA</p>

            <MetadataLine
              label="Categoria"
              value={firstItem.category}
              onPick={applyCategorySuggestion}
            />

            <MetadataLine
              label="Marca"
              value={firstItem.brand}
              onPick={applyCategorySuggestion}
            />

            <MetadataLine
              label="Producto"
              value={firstItem.product}
              onPick={applyCategorySuggestion}
            />

            <div className="mt-2">
              <p className="text-xs text-zinc-500">Tags</p>
              {categorySuggestions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {categorySuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => applyCategorySuggestion(tag)}
                      className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-white/40 hover:text-white"
                      title="Usar como categoria"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">sin tags</p>
              )}
            </div>

            {firstItem.worldStatus && (
              <p className="mt-2 text-xs text-cyan-200">
                Mundo: {firstItem.worldName || "revision manual"} · {firstItem.worldConfidence || "sin confianza"}
              </p>
            )}

            {firstItem.duplicateResolved && (
              <p className="mt-2 text-xs text-emerald-300">
                Categoria ajustada para evitar nombre repetido.
              </p>
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
              {family.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[60px_1fr_120px] gap-3 items-center bg-zinc-900 border border-zinc-800 rounded-xl p-3"
                >
                  {item.previewUrl ? (
                    <button
                      type="button"
                      onClick={() => openImage(item)}
                      className="block"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.originalName}
                        className="w-14 h-14 object-cover rounded-lg bg-black"
                      />
                    </button>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-800" />
                  )}

                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">Original</p>

                    <p className="text-sm text-zinc-300 break-all">
                      {item.originalName}
                    </p>
                  </div>

                  <label className="space-y-1">
                    <span className="text-xs text-zinc-500">Plataforma</span>

                    <input
                      value={item.format || ""}
                      onChange={(event) =>
                        updateResult(
                          item.id,
                          "format",
                          event.target.value.toLowerCase()
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                    />
                  </label>
                  <CompressionInfo item={item} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onToggleExpanded}
            aria-keyshortcuts="E"
            title="Desglosar familia"
            className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition text-sm whitespace-nowrap"
          >
            {isExpanded ? "Ocultar" : "Desglosar"}
          </button>

          <button
            onClick={onAnalyzeFamily}
            disabled={isAnalyzing}
            aria-keyshortcuts="A"
            title="Analizar familia"
            className={`
              px-3 py-2 rounded-xl transition text-sm font-medium whitespace-nowrap
              ${
                isAnalyzing
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
              }
            `}
          >
            {isAnalyzing ? "Analizando..." : "Analizar IA"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>

      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value.toLowerCase())}
        placeholder="-"
        className="
          h-11 w-full
          rounded-xl border border-zinc-800
          bg-zinc-900/80 px-3
          text-sm text-white
          outline-none transition
          placeholder:text-zinc-600
          focus:border-zinc-500 focus:bg-zinc-900
        "
      />
    </label>
  )
}

function MetadataLine({ label, value, onPick }) {
  const cleanValue = String(value || "").trim()

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
      <span className="text-zinc-500">{label}:</span>
      {cleanValue ? (
        <button
          type="button"
          onClick={() => onPick(cleanValue)}
          className="rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-semibold text-zinc-200 transition hover:border-white/40 hover:text-white"
          title="Usar como categoria"
        >
          {cleanValue}
        </button>
      ) : (
        <span className="text-zinc-500">sin detectar</span>
      )}
    </div>
  )
}

function buildCategorySuggestions(item) {
  return [
    item.category,
    item.product,
    item.brand,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
}

function buildAiPatch(item, result) {
  const patch = {
    category: result.category || "",
    brand: result.brand || "",
    product: result.product || "",
    tags: Array.isArray(result.tags) ? result.tags : [],
  }

  const targetWorldFamily = getTargetWorldFamily(item)

  if (!targetWorldFamily) return patch

  const worldResult = resolveWorldFromSignals({
    world: result.world,
    category: result.category,
    product: result.product,
    brand: result.brand,
    tags: result.tags,
    originalName: item.originalName,
  })

  patch.worldCode = worldResult.worldCode
  patch.worldName = worldResult.worldName
  patch.worldFolder = worldResult.worldFolder
  patch.worldConfidence = worldResult.worldConfidence
  patch.worldStatus = worldResult.worldStatus
  patch.worldReasons = worldResult.worldReasons
  patch.worldCandidates = worldResult.worldCandidates

  if (worldResult.worldCode) {
    const worldPiece = buildWorldPiece({
      worldCode: worldResult.worldCode,
      worldFamily: targetWorldFamily,
      piece: item.piece,
    })
    const folderGroup = item.folderGroup || ""

    patch.piece = worldPiece
    patch.finalFamily = targetWorldFamily
    patch.componentFamily = item.componentFamily || item.finalFamily
    patch.isWorldFamily = true
    patch.zipFolder = getWorldZipFolder({
      worldCode: worldResult.worldCode,
      worldFolder: worldResult.worldFolder,
      folderGroup,
    })
  }

  return patch
}

function getTargetWorldFamily(item) {
  if (item.isWorldFamily || isWorldFamily(item.finalFamily)) {
    return item.finalFamily
  }

  if (item.ruleProfile !== "cyberday" || !item.worldMode) return ""

  return getWorldFamilyForComponentFamily(item.finalFamily)
}

function getDescriptorFields(descriptorMode = "category") {
  if (descriptorMode === "brand") {
    return ["brand"]
  }

  if (descriptorMode === "brand-category") {
    return ["brand", "category"]
  }

  if (descriptorMode === "category-brand") {
    return ["category", "brand"]
  }

  return ["category"]
}

function groupByPiece(results) {
  const grouped = {}

  results.forEach((item) => {
    const stableKey = item.familyId || item.id

    if (!grouped[stableKey]) {
      grouped[stableKey] = {
        familyId: stableKey,
        piece: item.piece || "manual",
        items: [],
      }
    }

    grouped[stableKey].items.push(item)
  })

  return Object.values(grouped)
}

function CompressionInfo({ item }) {
  if (!item.compressed) return null

  return (
    <div className="mt-2 space-y-1">
      <span className="inline-flex px-2 py-1 rounded-lg bg-yellow-500 text-black text-[10px] font-bold">
        comprimida
      </span>

      {item.originalSize && item.compressedSize && (
        <p className="text-[11px] text-yellow-300">
          {Math.round(item.originalSize / 1024)} KB
          {" -> "}
          {Math.round(item.compressedSize / 1024)} KB
        </p>
      )}
    </div>
  )
}
