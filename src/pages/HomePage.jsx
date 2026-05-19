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

import { fakeAiProcessor } from "@/services/fakeAiProcessor"
import { getActiveCampaigns } from "@/services/campaignService"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"
import { defaultPreferences, useUserStore } from "@/store/useUserStore"

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
    setDefaultConfig,
    setSelectedCampaign,
  } = useNomenclaturaStore()

  const user = useUserStore((state) => state.user)
  const preferences =
    useUserStore((state) => state.preferences)

  const effectivePreferences = user
    ? preferences
    : defaultPreferences

  const effectiveDescriptorMode =
    effectivePreferences.descriptor_mode || "category"

  useEffect(() => {
    setDefaultConfig({
      country: effectivePreferences.default_country || "cl",
      campaign: effectivePreferences.default_campaign || "hg",
      descriptorMode: effectiveDescriptorMode,
    })
  }, [
    effectivePreferences.default_country,
    effectivePreferences.default_campaign,
    effectiveDescriptorMode,
    setDefaultConfig,
  ])

  const [campaignOptions, setCampaignOptions] = useState([])
  const [showCampaignSelector, setShowCampaignSelector] = useState(false)

  const handleFilesReady = (groupedData) => {
    setFamilies(groupedData.families)
    setManualFiles(groupedData.manualFiles)
    setCurrentStep("review")
  }

  const processWithConfig = async (config) => {
    setCurrentStep("processing")
    setIsProcessing(true)

    const processedResults =
      await fakeAiProcessor(
        families,
        config
      )

    setResults(processedResults)

    setIsProcessing(false)
    setCurrentStep("edit")
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

    if (!effectivePreferences.use_active_campaigns) {
      const config = {
        ...defaultConfig,
        country,
        campaign: fallbackCampaign,
        descriptorMode: effectiveDescriptorMode,
      }

      setDefaultConfig(config)
      await processWithConfig(config)
      return
    }

    const activeCampaigns =
      await getActiveCampaigns(country)

    if (activeCampaigns.length === 0) {
      const config = {
        ...defaultConfig,
        country,
        campaign: fallbackCampaign,
        descriptorMode: effectiveDescriptorMode,
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
    }

    setDefaultConfig(config)
    setSelectedCampaign(campaign)

    setShowCampaignSelector(false)

    await processWithConfig(config)
  }

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
        bg-black/50
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

          <UserLogin />

        </div>

        <StepIndicator
          currentStep={currentStep}
        />

        {currentStep === "upload" && (

          <ImageUploader
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

        {showCampaignSelector && (

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

      </section>

    </main>
  )
}
const themeBackgroundMap = {
  midnight:
    "radial-gradient(circle at 8% 0%, rgba(39,39,42,0.38), transparent 32%), radial-gradient(circle at 92% 8%, rgba(24,24,27,0.35), transparent 30%), #000",

  cyber:
    "radial-gradient(circle at 0% 0%, rgba(112,26,117,0.38), transparent 34%), radial-gradient(circle at 100% 8%, rgba(8,145,178,0.18), transparent 30%), #000",

  ocean:
    "radial-gradient(circle at 0% 0%, rgba(14,116,144,0.28), transparent 34%), radial-gradient(circle at 100% 10%, rgba(30,64,175,0.18), transparent 30%), #000",

  sunset:
    "radial-gradient(circle at 0% 0%, rgba(194,65,12,0.26), transparent 34%), radial-gradient(circle at 100% 8%, rgba(157,23,77,0.22), transparent 30%), #000",

  luxury:
    "radial-gradient(circle at 0% 0%, rgba(113,63,18,0.28), transparent 34%), radial-gradient(circle at 100% 8%, rgba(202,138,4,0.12), transparent 28%), #000",
}
