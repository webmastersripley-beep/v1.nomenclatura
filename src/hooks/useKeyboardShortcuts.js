import { useEffect } from "react"

export function useKeyboardShortcuts(shortcuts = [], options = {}) {
  useEffect(() => {
    if (options.enabled === false) return undefined

    const handler = createKeyboardShortcutHandler(shortcuts, options)

    window.addEventListener("keydown", handler)

    return () => {
      window.removeEventListener("keydown", handler)
    }
  }, [shortcuts, options])
}

export function createKeyboardShortcutHandler(shortcuts = [], options = {}) {
  return (event) => {
    if (
      event.defaultPrevented ||
      options.enabled === false ||
      shouldIgnoreShortcut(event, options)
    ) {
      return
    }

    const shortcut = shortcuts.find((item) =>
      item &&
      item.enabled !== false &&
      matchesShortcut(event, item)
    )

    if (!shortcut) return

    if (shortcut.preventDefault !== false) {
      event.preventDefault?.()
    }

    shortcut.handler?.(event)
  }
}

export function shouldIgnoreShortcut(event, options = {}) {
  if (options.ignoreEditable === false) {
    return false
  }

  const target = event.target

  if (!target) return false

  if (target.isContentEditable) return true

  const tagName = String(target.tagName || "").toLowerCase()

  return ["input", "select", "textarea"].includes(tagName)
}

export function matchesShortcut(event, shortcut) {
  return (
    normalizeKey(event.key) === normalizeKey(shortcut.key) &&
    Boolean(event.altKey) === Boolean(shortcut.altKey) &&
    Boolean(event.ctrlKey) === Boolean(shortcut.ctrlKey) &&
    Boolean(event.metaKey) === Boolean(shortcut.metaKey) &&
    Boolean(event.shiftKey) === Boolean(shortcut.shiftKey)
  )
}

function normalizeKey(key) {
  return String(key || "").toLowerCase()
}
