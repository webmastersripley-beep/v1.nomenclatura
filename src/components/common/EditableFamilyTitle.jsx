import { useEffect, useRef, useState } from "react"
import { Pencil } from "lucide-react"

export default function EditableFamilyTitle({
  piece,
  groupNumber,
  size = "md",
  onSave,
}) {
  const inputRef = useRef(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(piece || "")

  useEffect(() => {
    if (!isEditing) return

    inputRef.current?.focus()
    inputRef.current?.select()
  }, [isEditing])

  const startEditing = () => {
    setDraft(piece || "")
    setIsEditing(true)
  }

  const commit = () => {
    const cleanValue = draft.trim()

    setIsEditing(false)

    if (!cleanValue || cleanValue === piece) return

    onSave?.(cleanValue)
  }

  const cancel = () => {
    setDraft(piece || "")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            commit()
          }

          if (event.key === "Escape") {
            event.preventDefault()
            cancel()
          }
        }}
        className={`
          min-w-0 rounded-xl border border-white/15
          bg-zinc-950/80 px-3 py-1
          font-bold text-white outline-none
          focus:border-white/40
          ${size === "lg" ? "text-3xl" : "text-xl"}
        `}
      />
    )
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <h3
        tabIndex={0}
        onDoubleClick={startEditing}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            startEditing()
          }
        }}
        className={`min-w-0 truncate font-bold outline-none focus:text-white ${
          size === "lg" ? "text-3xl" : "text-xl"
        }`}
        title="Doble click para editar"
      >
        Familia {piece}
        {groupNumber ? (
          <span className="ml-2 font-normal text-zinc-500">
            grupo {groupNumber}
          </span>
        ) : null}
      </h3>

      <button
        type="button"
        onClick={startEditing}
        className="
          inline-flex h-7 w-7 shrink-0 items-center justify-center
          rounded-full bg-white/10 text-zinc-300
          transition hover:bg-white/15 hover:text-white
        "
        title="Editar nombre de familia"
        aria-label="Editar nombre de familia"
      >
        <Pencil size={14} />
      </button>
    </div>
  )
}
