import { useState } from "react"
import { toast } from "sonner"

import { findUserByName } from "@/services/userService"
import { useUserStore } from "@/store/useUserStore"

export default function UserLogin() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const logout = useUserStore((state) => state.logout)

  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!name.trim()) {
      toast.error("Ingresa un usuario")
      return
    }

    try {
      setIsLoading(true)

      const foundUser =
        await findUserByName(name)

      if (!foundUser) {
        toast.error("Usuario no encontrado")
        return
      }

      setUser(foundUser)

      toast.success(
        `Bienvenido ${foundUser.name}`
      )

      setName("")

    } catch (error) {

      console.error(error)

      toast.error(
        "Error iniciando sesión"
      )

    } finally {

      setIsLoading(false)
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800">
          <p className="text-sm text-zinc-300">
            {user.name}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 transition text-black font-medium"
        >
          Salir
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
        placeholder="Usuario"
        className="
          bg-zinc-900
          border border-zinc-800
          rounded-xl
          px-4 py-2
          text-sm text-white
          outline-none
          focus:border-zinc-500
        "
      />

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-xl transition font-medium
          ${
            isLoading
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-white text-black hover:opacity-90"
          }
        `}
      >
        {isLoading
          ? "Entrando..."
          : "Ingresar"}
      </button>
    </div>
  )
}