const sizeRules = [
  {
    component: "sl",
    format: "desk",
    width: 1920,
    height: 652,
  },
  {
    component: "sl",
    format: "mb",
    width: 1150,
    height: 1150,
  },
  {
    component: "bx",
    format: "desk",
    width: 570,
    height: 800,
  },
  {
    component: "bx",
    format: "mb",
    width: 766,
    height: 1168,
  },
  {
    component: "bx",
    format: "desk",
    width: 1632,
    height: 822,
  },
  {
    component: "ol",
    format: "desk",
    width: 1156,
    height: 463,
  },
  {
    component: "ol",
    format: "desk",
    width: 578,
    height: 463,
  },
  {
    component: "ol",
    format: "mb",
    width: 480,
    height: 315,
  },
]

export function detectBySize(width, height) {
  if (!width || !height) {
    return null
  }

  const tolerance = 10

  const match = sizeRules.find((rule) => {
    const widthDiff = Math.abs(rule.width - width)
    const heightDiff = Math.abs(rule.height - height)

    return widthDiff <= tolerance && heightDiff <= tolerance
  })

  if (!match) {
    return null
  }

  return {
    component: match.component,
    format: match.format,
    detectedBySize: true,
  }
}