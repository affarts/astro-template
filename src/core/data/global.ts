import { getImageGlob } from '@scripts/utils/astro'

export const globalImages = {
  imgSample1: await getImageGlob(
    import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*'),
    'sample-image-1.jpg'
  ),
  imgSample1Mobile: await getImageGlob(
    import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*'),
    'sample-image-1-mobile.jpg'
  )
}
