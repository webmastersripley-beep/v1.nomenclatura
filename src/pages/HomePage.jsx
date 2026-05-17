import ImageUploader from "@/components/upload/ImageUploader"
import StepIndicator from "@/components/steps/StepIndicator"
import ReviewStep from "@/components/steps/ReviewStep"
import EditStep from "@/components/steps/EditStep"
import DownloadStep from "@/components/steps/DownloadStep"
import ProcessingStep from "@/components/steps/ProcessingStep"
import UserLogin from "@/components/auth/UserLogin"

import { fakeAiProcessor } from "@/services/fakeAiProcessor"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"

export default function HomePage() {
  const {
    currentStep,
    families,
    manualFiles,
    defaultConfig,
    setCurrentStep,
    setFamilies,
    setManualFiles,
    setResults,
    setIsProcessing,
  } = useNomenclaturaStore()

  const handleFilesReady = (
    groupedData
  ) => {

    setFamilies(
      groupedData.families
    )

    setManualFiles(
      groupedData.manualFiles
    )

    setCurrentStep(
      "review"
    )
  }

  const handleProcessFamilies = async () => {
    setCurrentStep("processing")
    setIsProcessing(true)

    const processedResults =
      await fakeAiProcessor(
        families,
        defaultConfig
      )

    setResults(processedResults)

    setIsProcessing(false)

    setCurrentStep("edit")
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="max-w-7xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">

          <div>
            <h1 className="text-5xl font-bold tracking-tight">
              Nomenclaturas
            </h1>

            <p className="text-zinc-400 mt-2">
              Sistema inteligente de nomenclaturas retail
            </p>
          </div>

          <UserLogin />

        </div>

        <StepIndicator
          currentStep={currentStep}
        />

        {currentStep === "upload" && (
          <ImageUploader
            onFilesReady={handleFilesReady}
          />
        )}

        {currentStep === "review" && (
          <ReviewStep
            families={families}
            onBack={() =>
              setCurrentStep("upload")
            }
            onNext={handleProcessFamilies}
          />
        )}

        {currentStep === "processing" && (
          <ProcessingStep />
        )}

        {currentStep === "edit" && (
          <EditStep
            onBack={() =>
              setCurrentStep("review")
            }
            onNext={() =>
              setCurrentStep("download")
            }
          />
        )}

        {currentStep === "download" && (
          <DownloadStep
            families={families}
            onBack={() =>
              setCurrentStep("edit")
            }
          />
        )}

      </section>
    </main>
  )
}