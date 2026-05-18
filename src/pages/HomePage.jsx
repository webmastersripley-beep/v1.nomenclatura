import { useState } from "react"
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
import { useUserStore } from "@/store/useUserStore"

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

  const preferences =
    useUserStore((state) => state.preferences)

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
      preferences.default_country ||
      defaultConfig.country ||
      "cl"

    const fallbackCampaign =
      preferences.default_campaign ||
      defaultConfig.campaign ||
      "hg"

    if (!preferences.use_active_campaigns) {
      const config = {
        ...defaultConfig,
        country,
        campaign: fallbackCampaign,
        descriptorMode:
          preferences.descriptor_mode ||
          "category",
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
        descriptorMode:
          preferences.descriptor_mode ||
          "category",
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
        descriptorMode:
          preferences.descriptor_mode ||
          "category",
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
      preferences.default_country ||
      defaultConfig.country ||
      "cl"

    const config = {
      ...defaultConfig,
      country,
      campaign: campaign.code,
      descriptorMode:
        preferences.descriptor_mode ||
        "category",
    }

    setDefaultConfig(config)
    setSelectedCampaign(campaign)

    setShowCampaignSelector(false)

    await processWithConfig(config)
  }

  return (

    <main className={`
      min-h-screen
      text-white
      relative
      overflow-hidden
      ${themeMap[
        preferences.theme_preset
      ] || themeMap.midnight}
    `}>

      {(preferences.background_type ===
        "image" ||
        preferences.background_type ===
        "mixed") &&

        preferences.background_image_url && (

        <div
          className="
            absolute inset-0
            bg-cover bg-center
            z-0
          "
          style={{

            backgroundImage:
              `url(${preferences.background_image_url})`,

            opacity:
              preferences.background_opacity || 0.15,
          }}
        />
      )}

      {preferences.enable_blobs && (
        <>

          <div className="
            absolute
            top-[-120px]
            left-[-120px]
            w-[420px]
            h-[420px]
            rounded-full
            bg-fuchsia-500/20
            blur-3xl
            z-0
          " />

          <div className="
            absolute
            bottom-[-160px]
            right-[-160px]
            w-[500px]
            h-[500px]
            rounded-full
            bg-cyan-500/20
            blur-3xl
            z-0
          " />

          <div className="
            absolute
            top-[30%]
            left-[50%]
            w-[280px]
            h-[280px]
            rounded-full
            bg-purple-500/10
            blur-3xl
            z-0
          " />

        </>
      )}

      <div className="
        absolute inset-0
        bg-black/40
        backdrop-blur-[2px]
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
