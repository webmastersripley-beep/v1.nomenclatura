import { useState } from "react"

export default function CampaignSelectionModal({
  campaigns = [],
  onConfirm,
  onCancel,
}) {

  const [selectedId, setSelectedId] =
    useState(
      campaigns[0]?.id || null
    )

  const selectedCampaign =
    campaigns.find(
      (campaign) =>
        campaign.id === selectedId
    )

  return (
    <div className="
      fixed inset-0
      bg-black/80
      flex items-center justify-center
      z-[120]
      p-4
    ">

      <div className="
        w-full max-w-2xl
        bg-zinc-900
        border border-zinc-800
        rounded-3xl
        overflow-hidden
      ">

        <div className="
          px-6 py-5
          border-b border-zinc-800
        ">

          <h2 className="
            text-2xl font-bold
          ">
            Seleccionar campaña
          </h2>

          <p className="
            text-zinc-400 text-sm mt-2
          ">
            Existen múltiples campañas
            activas para este horario.
          </p>

        </div>

        <div className="
          p-6
          space-y-4
          max-h-[60vh]
          overflow-y-auto
        ">

          {campaigns.map(
            (campaign) => {

              const isSelected =
                campaign.id === selectedId

              return (

                <button
                  key={campaign.id}
                  onClick={() =>
                    setSelectedId(
                      campaign.id
                    )
                  }
                  className={`
                    w-full
                    text-left
                    border rounded-2xl
                    p-5
                    transition
                    ${
                      isSelected
                        ? "border-fuchsia-500 bg-fuchsia-500/10"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }
                  `}
                >

                  <div className="
                    flex items-start justify-between
                  ">

                    <div>

                      <h3 className="
                        text-lg font-bold
                      ">
                        {campaign.name}
                      </h3>

                      <p className="
                        text-zinc-500 text-sm mt-1
                      ">
                        {campaign.code}
                      </p>

                    </div>

                    {isSelected && (

                      <span className="
                        text-xs
                        px-2 py-1
                        rounded-full
                        bg-fuchsia-500/20
                        text-fuchsia-300
                      ">
                        Seleccionada
                      </span>
                    )}

                  </div>

                  <div className="
                    mt-4
                    text-sm text-zinc-400
                    space-y-1
                  ">

                    <p>
                      Inicio:
                      <span className="
                        text-white ml-2
                      ">
                        {formatDate(
                          campaign.start_at
                        )}
                      </span>
                    </p>

                    <p>
                      Término:
                      <span className="
                        text-white ml-2
                      ">
                        {formatDate(
                          campaign.end_at
                        )}
                      </span>
                    </p>

                  </div>

                </button>
              )
            }
          )}

        </div>

        <div className="
          px-6 py-5
          border-t border-zinc-800
          flex justify-end gap-3
        ">

          <button
            onClick={onCancel}
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
            onClick={() =>
              onConfirm(
                selectedCampaign
              )
            }
            disabled={!selectedCampaign}
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
            Continuar
          </button>

        </div>

      </div>

    </div>
  )
}

function formatDate(value) {

  if (!value) {
    return "-"
  }

  return new Date(value)
    .toLocaleString(
      "es-CL",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    )
}