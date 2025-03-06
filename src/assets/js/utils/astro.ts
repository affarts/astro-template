export const getImageGlob = (
  imagesPath: Record<string, () => Promise<{ default: ImageMetadata }>>,
  filename: string
) => {
  const imageKey = Object.keys(imagesPath).find((key) => key.endsWith(filename))

  if (!imageKey) {
    throw new Error(`"${filename}" does not exist in the provided images glob.`)
  }

  return imagesPath[imageKey]()
}

export const getImageByName = (images, name) => {
  const image = images.find((img) => img.file && img.file.includes(name))
  return image ? image.default : null
}
