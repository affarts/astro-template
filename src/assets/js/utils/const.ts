const mediaMobile = () => window.matchMedia('(max-width: 767px)')
const mediaTablet = () =>
  window.matchMedia('(min-width: 768px) and (max-width: 1279px)')
const mediaDesktop = () => window.matchMedia('(min-width: 1280px)')
const mediaTouch = () => window.matchMedia('(pointer: coarse)')
const mediaMinDesktop = () => window.matchMedia('(min-width: 1024px)')
const rotateMedia = () =>
  window.matchMedia('(orientation: landscape) and (max-height: 444px)')

export {
  mediaMobile,
  mediaTablet,
  mediaDesktop,
  mediaTouch,
  rotateMedia,
  mediaMinDesktop
}
