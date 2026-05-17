export function getImageDimensions(file) {
  return new Promise((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      resolve({
        width: image.width,
        height: image.height,
        previewUrl: url,
      })
    }

    image.onerror = () => {
      resolve({
        width: null,
        height: null,
        previewUrl: url,
      })
    }

    image.src = url
  })
}