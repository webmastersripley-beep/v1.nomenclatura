import { create } from "zustand"
import {
  sanitizeValue,
  sanitizeTags
} from "../utils/sanitizeValue.js"
import { buildFinalName } from "../utils/buildFinalName.js"
import {
  getFolderForPiece,
  isPlaceholderPiece,
  normalizeCyberComponent,
} from "../utils/cyberNomenclatureRules.js"
import { resolveDuplicateFinalNames } from "../utils/resolveDuplicateFinalNames.js"
import { RULE_PROFILE_AUTO } from "../utils/ruleProfiles.js"

export const useNomenclaturaStore = create((set) => ({
  currentStep: "upload",

  families: [],
  manualFiles: [],
  results: [],
  isProcessing: false,
  processingProgress: null,
  processAuditId: null,
  processAuditStatus: "idle",
  processAuditError: "",
  

  defaultConfig: {
    campaign: "hg",
    country: "cl",
    date: getTodayFormatted(),
    descriptorMode: "category",
    ruleProfile: RULE_PROFILE_AUTO,
    worldMode: false,
  },
  activeCampaigns: [],

  selectedCampaign: null,

  setCurrentStep: (step) => set({ currentStep: step }),
  setFamilies: (families) => set({ families }),
  setManualFiles: (manualFiles) => set({ manualFiles }),
  setResults: (results) => set({ results: resolveDuplicateFinalNames(results) }),
  setIsProcessing: (value) => set({ isProcessing: value }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  setProcessAuditId: (processAuditId) => set({ processAuditId }),
  setProcessAuditStatus: (processAuditStatus) => set({ processAuditStatus }),
  setProcessAuditError: (processAuditError) => set({ processAuditError }),
  renameFamily: (familyId, nextPiece) =>
    set((state) => {
      const family = state.families.find((item) => item.familyId === familyId)
      const identity = resolveManualPieceIdentity(nextPiece, family)

      if (!family || !identity.piece || identity.piece === family.piece) {
        return state
      }

      const familyPatch = {
        familyKey: `${identity.basePiece}-grupo-${family.groupNumber || 1}`,
        basePiece: identity.basePiece,
        piece: identity.piece,
        folderGroup: identity.folderGroup,
        isPlaceholder: false,
        manualPieceOverride: true,
      }

      return {
        families: state.families.map((item) => {
          if (item.familyId !== familyId) return item

          return {
            ...item,
            ...familyPatch,
            files: item.files.map((file) => ({
              ...file,
              piece: identity.piece,
              familyKey: familyPatch.familyKey,
              folderGroup: identity.folderGroup,
              manualPieceOverride: true,
            })),
          }
        }),
        manualFiles: state.manualFiles.map((file) => {
          if (file.familyId !== familyId) return file

          return {
            ...file,
            piece: identity.piece,
            familyKey: familyPatch.familyKey,
            folderGroup: identity.folderGroup,
            manualPieceOverride: true,
          }
        }),
      }
    }),
  renameResultFamily: (familyId, nextPiece) =>
    set((state) => {
      const familyItems = state.results.filter((item) => item.familyId === familyId)
      const firstItem = familyItems[0]
      const identity = resolveManualPieceIdentity(nextPiece, firstItem)

      if (!firstItem || !identity.piece || identity.piece === firstItem.piece) {
        return state
      }

      const updatedResults = state.results.map((item) => {
        if (item.familyId !== familyId) return item

        const updatedItem = {
          ...item,
          piece: identity.piece,
          folderGroup: identity.folderGroup,
          manualPieceOverride: true,
        }

        updatedItem.finalName = buildFinalName(
          {
            ...updatedItem,
            category: updatedItem.category || "manual",
            date: updatedItem.date || state.defaultConfig.date,
          },
          updatedItem.descriptorMode ||
            state.defaultConfig.descriptorMode ||
            "category"
        )

        return updatedItem
      })

      return {
        results: resolveDuplicateFinalNames(updatedResults),
      }
    }),
  setActiveCampaigns:
  (campaigns) =>
    set({
      activeCampaigns: campaigns,
    }),

setSelectedCampaign:
  (campaign) =>
    set({
      selectedCampaign: campaign,
    }),

setDefaultConfig:
  (config) =>
    set((state) => ({
      defaultConfig: {
        ...state.defaultConfig,
        ...config,
      },
    })),

  createEmptyFamily: () =>
    set((state) => {
      const groupNumber = state.families.length + 1
      const familyId = crypto.randomUUID()

      const newFamily = {
        familyId,
        familyKey: `grupo-${groupNumber}`,
        basePiece: `grupo-${groupNumber}`,
        groupNumber,
        piece: `grupo-${groupNumber}`,
        folderGroup: "manuales",
        isManualCreated: true,
        isPlaceholder: true,
        files: [],
      }

      return {
        families: [...state.families, newFamily],
      }
    }),

  moveManualToFamily: (manualId, targetFamilyId, format) =>
    set((state) => {
      const manualFile = state.manualFiles.find(
        (file) => file.manualId === manualId
      )

      const targetFamily = state.families.find(
        (family) => family.familyId === targetFamilyId
      )

      if (!manualFile || !targetFamily) return state

      const requestedFormat = (
        format ||
        manualFile.format ||
        manualFile.detectedFormat ||
        ""
      )
        .trim()
        .toLowerCase()

      const existingFormats = new Set(
        targetFamily.files
          .map((file) => file.format || file.detectedFormat || "")
          .filter(Boolean)
      )

      const missingFormats = ["desk", "mb", "app"].filter(
        (item) => !existingFormats.has(item)
      )

      const cleanFormat =
        requestedFormat || (missingFormats.length === 1 ? missingFormats[0] : "")

      if (!cleanFormat) return state

      const formatExists = existingFormats.has(cleanFormat)

      if (formatExists) return state

      const targetIdentity = resolveTargetFamilyIdentity(
        targetFamily,
        manualFile
      )

      const updatedFamilies = state.families.map((family) => {
        if (family.familyId !== targetFamilyId) return family

        return {
          ...family,
          ...targetIdentity.familyPatch,
          files: [
            ...family.files,
            {
              ...manualFile,
              piece: targetIdentity.piece,
              format: cleanFormat,
              detectedFormat: cleanFormat,
              familyId: family.familyId,
              familyKey: targetIdentity.familyPatch.familyKey || family.familyKey,
              folderGroup: targetIdentity.folderGroup,
            },
          ],
        }
      })

      const updatedManualFiles = state.manualFiles.filter(
        (file) => file.manualId !== manualId
      )

      return {
        families: updatedFamilies,
        manualFiles: updatedManualFiles,
      }
    }),

  moveFileToFamily: (fileOriginalName, sourceFamilyId, targetFamilyId) =>
    set((state) => {
      if (sourceFamilyId === targetFamilyId) return state

      const sourceFamily = state.families.find(
        (family) => family.familyId === sourceFamilyId
      )

      const targetFamily = state.families.find(
        (family) => family.familyId === targetFamilyId
      )

      if (!sourceFamily || !targetFamily) return state

      const movingFile = sourceFamily.files.find(
        (file) => file.originalName === fileOriginalName
      )

      if (!movingFile) return state

      const movingFormat = movingFile.format || movingFile.detectedFormat

      const formatExists = targetFamily.files.some(
        (file) =>
          file.format === movingFormat || file.detectedFormat === movingFormat
      )

      if (formatExists) return state

      const targetIdentity = resolveTargetFamilyIdentity(
        targetFamily,
        movingFile
      )

      const updatedFamilies = state.families
        .map((family) => {
          if (family.familyId === sourceFamilyId) {
            return {
              ...family,
              files: family.files.filter(
                (file) => file.originalName !== fileOriginalName
              ),
            }
          }

          if (family.familyId === targetFamilyId) {
            return {
              ...family,
              ...targetIdentity.familyPatch,
              files: [
                ...family.files,
                {
                  ...movingFile,
                  piece: targetIdentity.piece,
                  familyId: family.familyId,
                  familyKey: targetIdentity.familyPatch.familyKey || family.familyKey,
                  folderGroup: targetIdentity.folderGroup,
                },
              ],
            }
          }

          return family
        })
        .filter(
          (family) => family.files.length > 0 || family.familyId === targetFamilyId
        )

      return { families: updatedFamilies }
    }),

  moveFileToManual: (fileOriginalName, sourceFamilyId) =>
    set((state) => {
      const sourceFamily = state.families.find(
        (family) => family.familyId === sourceFamilyId
      )

      if (!sourceFamily) return state

      const movingFile = sourceFamily.files.find(
        (file) => file.originalName === fileOriginalName
      )

      if (!movingFile) return state

      const updatedFamilies = state.families.map((family) => {
        if (family.familyId !== sourceFamilyId) return family

        return {
          ...family,
          files: family.files.filter(
            (file) => file.originalName !== fileOriginalName
          ),
        }
      })

      const manualFile = {
        ...movingFile,
        manualId: crypto.randomUUID(),
        pendingReason: "moved_to_manual",
      }

      return {
        families: updatedFamilies,
        manualFiles: [...state.manualFiles, manualFile],
      }
    }),

  updateResult: (id, field, value) =>
    set((state) => {
      const currentItem = state.results.find((item) => item.id === id)

      if (!currentItem) return state

      if (field === "format") {
        const cleanFormat = value.trim().toLowerCase()

        const formatAlreadyExists = state.results.some((item) => {
          return (
            item.id !== id &&
            item.familyId === currentItem.familyId &&
            item.format === cleanFormat
          )
        })

        if (formatAlreadyExists) return state
      }

      const updatedResults = state.results.map((item) => {
        if (item.id !== id) return item

       const cleanValue =
          Array.isArray(value)
            ? sanitizeTags(value)
            : sanitizeValue(value)

        const updatedItem = {
          ...item,
          [field]: cleanValue,
        }

        updatedItem.finalName =
          buildFinalName(
            {
              ...updatedItem,
              category:
                updatedItem.category ||
                "manual",
              date:
                updatedItem.date ||
                state.defaultConfig.date,
            },
            updatedItem.descriptorMode ||
            state.defaultConfig.descriptorMode ||
            "category"
          )

        return updatedItem
      })

      return {
        results: resolveDuplicateFinalNames(updatedResults),
      }
    }),
  updateAllResults: (field, value) =>
    set((state) => {
      const cleanValue =
        Array.isArray(value)
          ? sanitizeTags(value)
          : sanitizeValue(value)

      return {
        results: resolveDuplicateFinalNames(state.results.map((item) => {
          const updatedItem = {
            ...item,
            [field]: cleanValue,
          }

          updatedItem.finalName =
            buildFinalName(
              {
                ...updatedItem,
                category:
                  updatedItem.category ||
                  "manual",
                date:
                  updatedItem.date ||
                  state.defaultConfig.date,
              },
              updatedItem.descriptorMode ||
              state.defaultConfig.descriptorMode ||
              "category"
            )

          return updatedItem
        })),
      }
    }),
  updateResultPatch: (id, patch) =>
    set((state) => {
      const updatedResults = state.results.map((item) => {
        if (item.id !== id) return item

        const patchEntries = Object.entries(patch || {}).filter(([field]) => {
          if (!item.manualPieceOverride) return true

          return ![
            "piece",
            "finalFamily",
            "componentFamily",
            "isWorldFamily",
            "folderGroup",
            "zipFolder",
          ].includes(field)
        })

        const cleanPatch = Object.fromEntries(
          patchEntries.map(([field, value]) => {
            if (field === "manualPieceOverride") return [field, Boolean(value)]
            if (field === "worldCandidates") return [field, value]
            if (["finalFamily", "componentFamily", "isWorldFamily"].includes(field)) {
              return [field, value]
            }
            if (Array.isArray(value)) return [field, sanitizeTags(value)]
            if ([
              "folderGroup",
              "zipFolder",
              "worldStatus",
              "worldConfidence",
            ].includes(field)) {
              return [field, String(value || "")]
            }
            return [field, sanitizeValue(value)]
          })
        )

        const updatedItem = {
          ...item,
          ...cleanPatch,
        }

        updatedItem.finalName =
          buildFinalName(
            {
              ...updatedItem,
              category:
                updatedItem.category ||
                "manual",
              date:
                updatedItem.date ||
                state.defaultConfig.date,
            },
            updatedItem.descriptorMode ||
            state.defaultConfig.descriptorMode ||
            "category"
          )

        return updatedItem
      })

      return {
        results: resolveDuplicateFinalNames(updatedResults),
      }
    }),

  recomputeFinalNames: (descriptorMode = "category") =>
    set((state) => ({
      results: resolveDuplicateFinalNames(state.results.map((item) => ({
        ...item,
        descriptorMode,
        finalName: buildFinalName(
          {
            ...item,
            date:
              item.date ||
              state.defaultConfig.date,
          },
          descriptorMode
        ),
      }))),
    })),

  resetProject: () =>
    set({
    currentStep: "upload",
    families: [],
    manualFiles: [],
    results: [],
    isProcessing: false,
    processingProgress: null,
    processAuditId: null,
    processAuditStatus: "idle",
    processAuditError: "",
  }),
}))

function getTodayFormatted() {
  const today = new Date()

  const day = String(today.getDate()).padStart(2, "0")
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const year = String(today.getFullYear()).slice(-2)

  return `${day}${month}${year}`
}

function resolveTargetFamilyIdentity(family, file) {
  const existingPiece = family.piece || family.basePiece || ""
  const shouldAdoptFilePiece =
    family.files.length === 0 &&
    (family.isPlaceholder || isPlaceholderPiece(existingPiece))
  const component =
    normalizeCyberComponent(
      shouldAdoptFilePiece
        ? file.piece || file.originalName
        : existingPiece
    ) ||
    normalizeCyberComponent(file.piece || file.originalName)
  const piece =
    shouldAdoptFilePiece
      ? component?.piece || file.piece || existingPiece
      : existingPiece
  const basePiece =
    component?.basePiece ||
    (shouldAdoptFilePiece ? piece : family.basePiece || piece)
  const folderGroup =
    component?.folderGroup ||
    family.folderGroup ||
    getFolderForPiece(piece, file.finalFamily)

  if (!shouldAdoptFilePiece) {
    return {
      piece,
      folderGroup,
      familyPatch: {
        folderGroup,
      },
    }
  }

  return {
    piece,
    folderGroup,
    familyPatch: {
      familyKey: `${basePiece}-grupo-${family.groupNumber || 1}`,
      basePiece,
      piece,
      folderGroup,
      isPlaceholder: false,
    },
  }
}

function resolveManualPieceIdentity(piece, fallback = {}) {
  const cleanPiece = sanitizeValue(piece)

  if (!cleanPiece) {
    return {
      piece: "",
      basePiece: "",
      folderGroup: fallback.folderGroup || "manuales",
    }
  }

  const component = normalizeCyberComponent(cleanPiece)
  const basePiece =
    component?.basePiece ||
    cleanPiece.replace(/\d+$/, "") ||
    cleanPiece
  const folderGroup =
    component?.folderGroup ||
    fallback.folderGroup ||
    getFolderForPiece(cleanPiece, fallback.finalFamily)

  return {
    piece: cleanPiece,
    basePiece,
    folderGroup,
  }
}
