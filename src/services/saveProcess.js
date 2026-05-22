import { completeProcessAudit } from "@/services/processAuditService"
import { useNomenclaturaStore } from "@/store/useNomenclaturaStore"

export async function saveProcess(
  results,
  {
    batchName = "",
    downloadMode = "",
    zipBlob = null,
  } = {}
) {
  if (!results?.length) return null

  const processAuditId = useNomenclaturaStore.getState().processAuditId

  const process = await completeProcessAudit(
    processAuditId,
    results,
    {
      batchName,
      downloadMode,
      zipBlob,
    }
  )

  if (!process) {
    throw new Error("Supabase no configurado")
  }

  return process
}
