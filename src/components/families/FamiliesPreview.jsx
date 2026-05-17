export default function FamiliesPreview({ families }) {
  return (
    <div className="mt-10 space-y-6">
      {families.map((family) => (
        <div
          key={family.piece}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
        >
          <h2 className="text-2xl font-bold mb-4">
            Familia {family.piece}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {family.files.map((file) => (
              <div
                key={file.originalName}
                className="bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800"
              >
                <img
                  src={file.previewUrl}
                  alt={file.originalName}
                  className="w-full h-48 object-contain bg-black"
                />

                <div className="p-4">
                  <p className="text-sm text-zinc-300 break-all">
                    {file.originalName}
                  </p>

                  <p className="text-xs text-zinc-500 mt-2">
                    Formato detectado: {file.format || "No detectado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}