import { supabase }
  from "@/lib/supabase"

import { useUserStore }
  from "@/store/useUserStore"

export async function saveProcess(
  results
) {
  const user =
    useUserStore.getState().user

  if (!results?.length) {
    return
  }

  const firstItem =
    results[0]

  const uniqueFamilies =
    new Set(
      results.map(
        (item) => item.familyId
      )
    )

  const {
    data: processData,
    error: processError,
  } = await supabase
    .from("processes")
    .insert({

      total_files:
        results.length,

      total_families:
        uniqueFamilies.size,

      country:
        firstItem.country || "",

      campaign:
        firstItem.campaign || "",

      app_user_id:
        user?.id || null,

      app_user_name:
        user?.name || "anonimo",
    })
    .select()
    .single()

  if (processError) {

    console.error(
      processError
    )

    throw new Error(
      "Error guardando proceso"
    )
  }

  const processItems =
    results.map((item) => ({

      process_id:
        processData.id,

      original_name:
        item.originalName,

      final_name:
        item.finalName,

      piece:
        item.piece,

      format:
        item.format,

      category:
        item.category,

      brand:
        item.brand || "",

      tags:
        Array.isArray(item.tags)
          ? item.tags
          : [],

      compressed:
        item.compressed || false,

      original_size:
        item.originalSize || null,

      compressed_size:
        item.compressedSize || null,
    }))

  const {
    error: itemsError,
  } = await supabase
    .from("process_items")
    .insert(processItems)

  if (itemsError) {

    console.error(
      itemsError
    )

    throw new Error(
      "Error guardando items"
    )
  }

  return processData
}