const steps = [
  { id: "upload", label: "Subida" },
  { id: "review", label: "Revisión" },
  { id: "edit", label: "Edición" },
  { id: "download", label: "Descarga" },
]

export default function StepIndicator({ currentStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = index < currentIndex

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  ${isActive ? "bg-white text-black" : ""}
                  ${isCompleted ? "bg-green-500 text-black" : ""}
                  ${!isActive && !isCompleted ? "bg-zinc-800 text-zinc-500" : ""}
                `}
              >
                {index + 1}
              </div>

              <span
                className={`
                  text-sm font-medium
                  ${isActive ? "text-white" : "text-zinc-500"}
                `}
              >
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <div className="w-10 h-px bg-zinc-700" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}