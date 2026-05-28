import { useEffect, useState } from "react"
import { toast } from "sonner"

import ImageUploader from "@/components/upload/ImageUploader"
import StepIndicator from "@/components/steps/StepIndicator"
import ReviewStep from "@/components/steps/ReviewStep"
import EditStep from "@/components/steps/EditStep"
import DownloadStep from "@/components/steps/DownloadStep"
import ProcessingStep from "@/components/steps/ProcessingStep"
import UserLogin from "@/components/auth/UserLogin"
import CampaignSelectionModal from "@/components/campaigns/CampaignSelectionModal"
import ShortcutHelpOverlay from "@/components/common/ShortcutHelpOverlay"

import { fakeAiProcessor } from "@/services/fakeAiProcessor"
import { processFamiliesWithAi } from "@/services/aiBatchProcessor"
import { getActiveCampaigns } from "@/services/campaignService"
import {
  startProcessAudit,
  syncReviewAudit,
} from "@/services/processAuditService"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { defaultPreferences, useUserStore } from "@/store/useUserStore"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import {
  RULE_PROFILE_AUTO,
  resolveRuleProfile,
} from "@/utils/ruleProfiles"

export default function HomePage() {
  const {
    currentStep,
    families,
    defaultConfig,
    setCurrentStep,
    setFamilies,
    setManualFiles,
    setResults,
    setIsProcessing,
    setProcessingProgress,
    setDefaultConfig,
    activeCampaigns: storedActiveCampaigns,
    setActiveCampaigns,
    selectedCampaign,
    setSelectedCampaign,
    processAuditId,
    setProcessAuditId,
    setProcessAuditStatus,
    setProcessAuditError,
  } = useNomenclaturaStore()
  const manualFiles = useNomenclaturaStore((state) => state.manualFiles)

  const user = useUserStore((state) => state.user)
  const preferences =
    useUserStore((state) => state.preferences)

  const effectivePreferences = user
    ? preferences
    : {
        ...defaultPreferences,
        use_active_campaigns: false,
      }

  const effectiveDescriptorMode =
    effectivePreferences.descriptor_mode || "category"

  const [campaignOptions, setCampaignOptions] = useState([])
  const [showCampaignSelector, setShowCampaignSelector] = useState(false)
  const [campaignSelectorMode, setCampaignSelectorMode] = useState("process")
  const [campaignBootstrapKey, setCampaignBootstrapKey] = useState("")
  const [showShortcuts, setShowShortcuts] = useState(false)
  const startupCountry =
    effectivePreferences.default_country ||
    defaultConfig.country ||
    "cl"
  const startupFallbackCampaign =
    effectivePreferences.default_campaign ||
    "hg"
  const startupCampaignKey = [
    user?.id || "anon",
    currentStep,
    effectivePreferences.use_active_campaigns ? "active" : "manual",
    startupCountry,
    startupFallbackCampaign,
  ].join("|")
  const isStartupCampaignReady =
    currentStep !== "upload" ||
    (campaignBootstrapKey === startupCampaignKey && !showCampaignSelector)
  const effectiveRuleProfile = resolveRuleProfile(
    defaultConfig.ruleProfile || RULE_PROFILE_AUTO,
    defaultConfig.campaign
  )

  useEffect(() => {
    if (!user) {
      setSelectedCampaign(null)
    }

    const nextConfig = {
      country: effectivePreferences.default_country || "cl",
      descriptorMode: effectiveDescriptorMode,
    }

    if (!user || !effectivePreferences.use_active_campaigns) {
      nextConfig.campaign = effectivePreferences.default_campaign || "hg"
    }

    setDefaultConfig(nextConfig)
  }, [
    user,
    effectivePreferences.default_country,
    effectivePreferences.default_campaign,
    effectivePreferences.use_active_campaigns,
    effectiveDescriptorMode,
    setDefaultConfig,
    setSelectedCampaign,
  ])

  useEffect(() => {
    if (!processAuditId || currentStep !== "review") return

    const timeoutId = window.setTimeout(async () => {
      try {
        setProcessAuditStatus("syncing")
        setProcessAuditError("")
        await syncReviewAudit(processAuditId, {
          families,
          manualFiles,
        })
        setProcessAuditStatus("saved")
      } catch (error) {
        console.error(error)
        setProcessAuditStatus("error")
        setProcessAuditError(error.message || "Error sincronizando Supabase")
      }
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [
    currentStep,
    families,
    manualFiles,
    processAuditId,
    setProcessAuditError,
    setProcessAuditStatus,
  ])

  useEffect(() => {
    if (
      currentStep !== "upload" ||
      campaignBootstrapKey === startupCampaignKey
    ) {
      return
    }

    let cancelled = false

    async function resolveStartupCampaign() {
      if (!user || !effectivePreferences.use_active_campaigns) {
        setActiveCampaigns([])
        setSelectedCampaign(null)
        setDefaultConfig({
          country: startupCountry,
          campaign: startupFallbackCampaign,
          descriptorMode: effectiveDescriptorMode,
        })
        setCampaignBootstrapKey(startupCampaignKey)
        return
      }

      try {
        const campaigns = await getActiveCampaigns(startupCountry)

        if (cancelled) return

        setActiveCampaigns(campaigns)
        setCampaignBootstrapKey(startupCampaignKey)

        if (campaigns.length === 0) {
          setSelectedCampaign(null)
          setDefaultConfig({
            country: startupCountry,
            campaign: startupFallbackCampaign,
            descriptorMode: effectiveDescriptorMode,
          })
          toast.info(`No hay campanas activas. Se usara ${startupFallbackCampaign}`)
          return
        }

        if (campaigns.length === 1) {
          const campaign = campaigns[0]

          setSelectedCampaign(campaign)
          setDefaultConfig({
            country: startupCountry,
            campaign: campaign.code,
            descriptorMode: effectiveDescriptorMode,
          })
          return
        }

        setCampaignOptions(campaigns)
        setCampaignSelectorMode("startup")
        setShowCampaignSelector(true)
      } catch (error) {
        if (cancelled) return

        console.error(error)
        setActiveCampaigns([])
        setSelectedCampaign(null)
        setDefaultConfig({
          country: startupCountry,
          campaign: startupFallbackCampaign,
          descriptorMode: effectiveDescriptorMode,
        })
        setCampaignBootstrapKey(startupCampaignKey)
        toast.error("No se pudieron leer las campanas activas")
      }
    }

    resolveStartupCampaign()

    return () => {
      cancelled = true
    }
  }, [
    campaignBootstrapKey,
    currentStep,
    effectiveDescriptorMode,
    effectivePreferences.use_active_campaigns,
    setActiveCampaigns,
    setDefaultConfig,
    setSelectedCampaign,
    startupCampaignKey,
    startupCountry,
    startupFallbackCampaign,
    user,
  ])

  const handleFilesReady = async (groupedData) => {
    setFamilies(groupedData.families)
    setManualFiles(groupedData.manualFiles)
    setCurrentStep("review")

    try {
      setProcessAuditStatus("syncing")
      setProcessAuditError("")
      const classifiedRuleProfile =
        groupedData.families?.[0]?.files?.[0]?.ruleProfile ||
        groupedData.manualFiles?.[0]?.ruleProfile ||
        effectiveRuleProfile
      const process = await startProcessAudit(groupedData, {
        config: {
          ...defaultConfig,
          ruleProfile: classifiedRuleProfile,
          worldMode: Boolean(defaultConfig.worldMode),
        },
      })

      if (process?.id) {
        setProcessAuditId(process.id)
        setProcessAuditStatus("saved")
      } else {
        setProcessAuditId(null)
        setProcessAuditStatus("disabled")
      }
    } catch (error) {
      console.error(error)
      setProcessAuditStatus("error")
      setProcessAuditError(error.message || "Error guardando en Supabase")
    }
  }

  const processWithConfig = async (config) => {
    setCurrentStep("processing")
    setIsProcessing(true)
    setProcessingProgress(null)

    try {
      const aiEnabled =
        import.meta.env.VITE_ENABLE_AI_ANALYSIS === "true"

      if (!aiEnabled) {
        toast.info("Modo prueba: IA desactivada para no consumir cuota.")
      }

      const processedResults =
        await (aiEnabled ? processFamiliesWithAi : fakeAiProcessor)(
          families,
          config,
          {
            concurrency: 4,
            onProgress: setProcessingProgress,
          }
        )

      setResults(processedResults)

      setCurrentStep("edit")
    } catch (error) {
      console.error(error)
      toast.error("Error procesando con IA")
      setCurrentStep("review")
    } finally {
      setIsProcessing(false)
      setProcessingProgress(null)
    }
  }

  const handleProcessFamilies = async () => {
    const country =
      effectivePreferences.default_country ||
      defaultConfig.country ||
      "cl"

    const fallbackCampaign =
      effectivePreferences.default_campaign ||
      defaultConfig.campaign ||
      "hg"

    if (!user || !effectivePreferences.use_active_campaigns) {
      const config = {
        ...defaultConfig,
        country,
        campaign: fallbackCampaign,
        descriptorMode: effectiveDescriptorMode,
        ruleProfile: resolveRuleProfile(defaultConfig.ruleProfile, fallbackCampaign),
        worldMode: Boolean(defaultConfig.worldMode),
      }

      setDefaultConfig(config)
      setSelectedCampaign(null)
      await processWithConfig(config)
      return
    }

    if (selectedCampaign) {
      const config = {
        ...defaultConfig,
        country,
        campaign: selectedCampaign.code,
        descriptorMode: effectiveDescriptorMode,
        ruleProfile: resolveRuleProfile(defaultConfig.ruleProfile, selectedCampaign.code),
        worldMode: Boolean(defaultConfig.worldMode),
      }

      setDefaultConfig(config)
      await processWithConfig(config)
      return
    }

    const activeCampaigns =
      storedActiveCampaigns.length > 0
        ? storedActiveCampaigns
        : await getActiveCampaigns(country)

    if (activeCampaigns.length === 0) {
      const config = {
        ...defaultConfig,
        country,
        campaign: fallbackCampaign,
        descriptorMode: effectiveDescriptorMode,
        ruleProfile: resolveRuleProfile(defaultConfig.ruleProfile, fallbackCampaign),
        worldMode: Boolean(defaultConfig.worldMode),
      }

      setDefaultConfig(config)
      setSelectedCampaign(null)

      toast.info(
        `No hay campañas activas. Se usará ${fallbackCampaign}`
      )

      await processWithConfig(config)
      return
    }

    if (activeCampaigns.length === 1) {
      const campaign = activeCampaigns[0]

      const config = {
        ...defaultConfig,
        country,
        campaign: campaign.code,
        descriptorMode: effectiveDescriptorMode,
        ruleProfile: resolveRuleProfile(defaultConfig.ruleProfile, campaign.code),
        worldMode: Boolean(defaultConfig.worldMode),
      }

      setDefaultConfig(config)
      setSelectedCampaign(campaign)

      toast.success(
        `Campaña activa aplicada: ${campaign.name}`
      )

      await processWithConfig(config)
      return
    }

    setCampaignOptions(activeCampaigns)
    setCampaignSelectorMode("process")
    setShowCampaignSelector(true)
  }

  const handleCampaignConfirm = async (campaign) => {
    if (!campaign) {
      toast.error("Selecciona una campaña")
      return
    }

    const country =
      effectivePreferences.default_country ||
      defaultConfig.country ||
      "cl"

    const config = {
      ...defaultConfig,
      country,
      campaign: campaign.code,
      descriptorMode: effectiveDescriptorMode,
      ruleProfile: resolveRuleProfile(defaultConfig.ruleProfile, campaign.code),
      worldMode: Boolean(defaultConfig.worldMode),
    }

    setDefaultConfig(config)
    setSelectedCampaign(campaign)

    setShowCampaignSelector(false)

    if (campaignSelectorMode === "startup") {
      return
    }

    await processWithConfig(config)
  }

  const toggleWorldMode = () => {
    setDefaultConfig({
      worldMode: !defaultConfig.worldMode,
    })
  }

  const goBack = () => {
    if (currentStep === "review") {
      setCurrentStep("upload")
      return
    }

    if (currentStep === "edit") {
      setCurrentStep("review")
      return
    }

    if (currentStep === "download") {
      setCurrentStep("edit")
    }
  }

  const goNext = () => {
    if (currentStep === "review") {
      handleProcessFamilies()
      return
    }

    if (currentStep === "edit") {
      setCurrentStep("download")
    }
  }

  useKeyboardShortcuts([
    {
      key: "?",
      handler: () => setShowShortcuts((current) => !current),
    },
    {
      key: "ArrowLeft",
      altKey: true,
      enabled: !showShortcuts && ["review", "edit", "download"].includes(currentStep),
      handler: goBack,
    },
    {
      key: "ArrowRight",
      altKey: true,
      enabled: !showShortcuts && ["review", "edit"].includes(currentStep),
      handler: goNext,
    },
    {
      key: "Escape",
      enabled: showCampaignSelector,
      handler: () => setShowCampaignSelector(false),
    },
  ])

  return (

    <main className={`
      min-h-[100dvh]
      overflow-x-hidden
      bg-black
      text-white
      relative
      isolate
    `}
      style={{
        background:
          themeBackgroundMap[effectivePreferences.theme_preset] ||
          themeBackgroundMap.midnight,
      }}
    >

      {(effectivePreferences.background_type ===
        "image" ||
        effectivePreferences.background_type ===
        "mixed") &&

        effectivePreferences.background_image_url && (

        <div
          className="
            pointer-events-none fixed inset-0
            bg-cover bg-center
            z-0
          "
          style={{

            backgroundImage:
              `url(${effectivePreferences.background_image_url})`,

            opacity:
              effectivePreferences.background_opacity || 0.15,
          }}
        />
      )}

      {effectivePreferences.enable_blobs && (
        <>

          <div className="
            pointer-events-none
            fixed
            top-[-160px]
            left-[-160px]
            w-[420px]
            h-[420px]
            rounded-full
            bg-fuchsia-500/14
            blur-3xl
            z-0
          " />

          <div className="
            pointer-events-none
            fixed
            bottom-[-260px]
            right-[-260px]
            w-[420px]
            h-[420px]
            rounded-full
            bg-cyan-500/8
            blur-3xl
            z-0
          " />

          <div className="
            pointer-events-none
            fixed
            top-[30%]
            left-[50%]
            w-[280px]
            h-[280px]
            rounded-full
            bg-purple-500/8
            blur-3xl
            z-0
          " />

        </>
      )}

      <div className="
        pointer-events-none fixed inset-0
        bg-black/25
        backdrop-blur-[1px]
        z-0
      " />

      <section className="
        relative z-10
        max-w-7xl
        mx-auto
        px-6 py-10
      ">

        <div className="
          flex items-start
          justify-between
          gap-6
          mb-10
          flex-wrap
        ">

          <div>

            <h1 className="
              text-5xl
              font-bold
              tracking-tight
            ">
              Nomenclaturas
            </h1>

            <p className="
              text-zinc-300
              mt-2
            ">
              Sistema inteligente
              de nomenclaturas retail
            </p>

          </div>

          <div className="flex items-center gap-3">
            <WorldModeToggle
              active={Boolean(defaultConfig.worldMode)}
              onToggle={toggleWorldMode}
            />

            <UserLogin />
          </div>

        </div>

        <StepIndicator
          currentStep={currentStep}
        />

        {currentStep === "upload" && (
          <ImageUploader
            disabled={!isStartupCampaignReady}
            statusText={
              isStartupCampaignReady
                ? ""
                : "Preparando campana activa..."
            }
            onFilesReady={
              handleFilesReady
            }
          />
        )}

        {currentStep === "review" && (

          <ReviewStep
            families={families}
            onBack={() =>
              setCurrentStep(
                "upload"
              )
            }
            onNext={
              handleProcessFamilies
            }
          />
        )}

        {currentStep === "processing" && (
          <ProcessingStep />
        )}

        {currentStep === "edit" && (

          <EditStep
            onBack={() =>
              setCurrentStep(
                "review"
              )
            }
            onNext={() =>
              setCurrentStep(
                "download"
              )
            }
          />
        )}

        {currentStep === "download" && (

          <DownloadStep
            families={families}
            onBack={() =>
              setCurrentStep(
                "edit"
              )
            }
          />
        )}

        {user && showCampaignSelector && (

          <CampaignSelectionModal
            campaigns={
              campaignOptions
            }
            onConfirm={
              handleCampaignConfirm
            }
            onCancel={() =>
              setShowCampaignSelector(
                false
              )
            }
          />
        )}

        <ShortcutHelpOverlay
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          sections={getShortcutSections(currentStep)}
        />

      </section>

    </main>
  )
}

function WorldModeToggle({ active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      title={active ? "Reglas de mundos activas" : "Activar reglas de mundos"}
      className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
        active
          ? "border-emerald-400/40 bg-emerald-500 text-black"
          : "border-zinc-800 bg-black/40 text-zinc-300 hover:border-zinc-600 hover:text-white"
      }`}
    >
      Mundos
    </button>
  )
}

function getShortcutSections(currentStep) {
  const sections = [
    {
      title: "Global",
      items: [
        { keys: "?", label: "Mostrar u ocultar atajos" },
        { keys: "Esc", label: "Cerrar modal o panel activo" },
        { keys: "Alt + ←", label: "Volver al paso anterior" },
        { keys: "Alt + →", label: "Continuar al siguiente paso" },
      ],
    },
    {
      title: "Imagenes",
      items: [
        { keys: "← / →", label: "Cambiar imagen en visor" },
        { keys: "+ / -", label: "Acercar o alejar" },
        { keys: "0", label: "Reiniciar zoom" },
      ],
    },
  ]

  if (currentStep === "review") {
    sections.push({
      title: "Revision",
      items: [
        { keys: "M", label: "Mostrar u ocultar manuales" },
        { keys: "Enter", label: "Abrir familia enfocada" },
      ],
    })
  }

  if (currentStep === "edit") {
    sections.push({
      title: "Edicion",
      items: [
        { keys: "A", label: "Analizar familia enfocada" },
        { keys: "E", label: "Desglosar familia enfocada" },
      ],
    })
  }

  if (currentStep === "download") {
    sections.push({
      title: "Descarga",
      items: [
        { keys: "D", label: "Descarga principal" },
        { keys: "C", label: "Comprimir imagenes pesadas" },
      ],
    })
  }

  return sections
}
const themeBackgroundMap = {
  midnight:
    "linear-gradient(135deg, rgb(9,9,11) 0%, rgb(0,0,0) 48%, rgb(24,24,27) 100%)",

  cyber:
    "linear-gradient(135deg, rgb(74,4,78) 0%, rgb(9,9,11) 52%, rgb(8,51,68) 100%)",

  ocean:
    "linear-gradient(135deg, rgb(8,51,68) 0%, rgb(23,37,84) 50%, rgb(9,9,11) 100%)",

  sunset:
    "linear-gradient(135deg, rgb(124,45,18) 0%, rgb(80,7,36) 52%, rgb(0,0,0) 100%)",

  luxury:
    "linear-gradient(135deg, rgb(113,63,18) 0%, rgb(0,0,0) 52%, rgb(9,9,11) 100%)",
}
