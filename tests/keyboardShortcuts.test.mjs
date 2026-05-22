import assert from "node:assert/strict"

import {
  createKeyboardShortcutHandler,
  matchesShortcut,
  shouldIgnoreShortcut,
} from "../src/hooks/useKeyboardShortcuts.js"
import { getNextImageZoom } from "../src/utils/imageZoom.js"

assert.equal(
  matchesShortcut(
    {
      key: "ArrowLeft",
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    },
    {
      key: "ArrowLeft",
      altKey: true,
    }
  ),
  true
)

assert.equal(
  shouldIgnoreShortcut({
    target: {
      tagName: "INPUT",
    },
  }),
  true
)

assert.equal(
  shouldIgnoreShortcut(
    {
      target: {
        tagName: "INPUT",
      },
    },
    {
      ignoreEditable: false,
    }
  ),
  false
)

let called = 0
let prevented = 0

const handler = createKeyboardShortcutHandler([
  {
    key: "r",
    handler: () => {
      called += 1
    },
  },
])

handler({
  key: "r",
  target: {
    tagName: "DIV",
  },
  preventDefault: () => {
    prevented += 1
  },
})

handler({
  key: "r",
  target: {
    tagName: "TEXTAREA",
  },
  preventDefault: () => {
    prevented += 1
  },
})

assert.equal(called, 1)
assert.equal(prevented, 1)

assert.equal(getNextImageZoom(1, "in"), 1.25)
assert.equal(getNextImageZoom(1, "out"), 0.75)
assert.equal(getNextImageZoom(3, "in"), 3)
assert.equal(getNextImageZoom(0.5, "out"), 0.5)
assert.equal(getNextImageZoom(2, "reset"), 1)

console.log("keyboard shortcuts ok")
