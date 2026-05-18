import { create } from "zustand"

const defaultPreferences = {

  default_country: "cl",

  default_campaign: "hg",

  download_mode:
    "por-familia",

  use_active_campaigns:
    true,

  theme_preset:
    "midnight",

  background_type:
    "gradient",

  background_image_url:
    "",

  background_opacity:
    0.15,

  enable_blobs:
    true,

  descriptor_mode:
    "category",
}

export const useUserStore =
  create((set) => ({

    user: null,

    preferences:
      defaultPreferences,

    setUser: (user) =>
      set({
        user,
      }),

    setPreferences:
      (preferences) =>
        set((state) => ({

          preferences: {

            ...state.preferences,

            ...preferences,
          },
        })),

    resetPreferences:
      () =>
        set({
          preferences:
            defaultPreferences,
        }),

    logout: () =>
      set({

        user: null,

        preferences:
          defaultPreferences,
      }),
  }))