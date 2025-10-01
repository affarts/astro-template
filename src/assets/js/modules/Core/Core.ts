/* eslint-disable no-console */
import { Modals } from '@scripts/modules/Modals/Modals'
import { debounce } from '@scripts/utils/global'
// import pkg from '@fluejs/noscroll'
// const { getScrollState } = pkg

declare global {
  export interface Window {
    ResizeObserver: any
  }
}

const HEADER_MAIN_GAP = 24

class ModuleManager {
  private static instance: ModuleManager
  private modules: { [key: string]: any } = {}
  private core: Core

  private constructor(core: Core) {
    this.core = core
  }

  public static getInstance(core: Core): ModuleManager {
    if (!this.instance) {
      this.instance = new ModuleManager(core)
    }
    return this.instance
  }

  // eslint-disable-next-line valid-jsdoc
  /**
   * Динамическая загрузка модулей с явными путями.
   * @param {string} moduleName - Название модуля.
   * @param {{ useModules?: string[] }} [options] - Опции для загрузки модуля.
   * @return {Promise<any>} Промис, который разрешается загруженным модулем.
   */
  public async loadModule(
    moduleName: string,
    options?: { useModules?: string[] }
  ): Promise<any> {
    if (!this.modules[moduleName]) {
      try {
        switch (moduleName) {
          case 'swiper': {
            const { default: Swiper } = await import('swiper')
            this.modules[moduleName] = Swiper
            if (options?.useModules) {
              const modulesToUse = []
              for (const module of options.useModules) {
                switch (module) {
                  case 'Navigation':
                    const { Navigation } = await import('swiper/modules')
                    modulesToUse.push(Navigation)
                    break
                  case 'Pagination':
                    const { Pagination } = await import('swiper/modules')
                    modulesToUse.push(Pagination)
                    break
                  case 'Grid':
                    const { Grid } = await import('swiper/modules')
                    modulesToUse.push(Grid)
                    break
                  case 'Keyboard':
                    const { Keyboard } = await import('swiper/modules')
                    modulesToUse.push(Keyboard)
                    break
                  case 'EffectFade':
                    const { EffectFade } = await import('swiper/modules')
                    modulesToUse.push(EffectFade)
                    break
                  case 'FreeMode':
                    const { FreeMode } = await import('swiper/modules')
                    modulesToUse.push(FreeMode)
                    break
                  case 'Mousewheel':
                    const { Mousewheel } = await import('swiper/modules')
                    modulesToUse.push(Mousewheel)
                    break
                  case 'Controller':
                    const { Controller } = await import('swiper/modules')
                    modulesToUse.push(Controller)
                    break
                  default:
                    console.warn(`Unknown module: ${module}`)
                    break
                }
              }
              this.modules[moduleName].use(modulesToUse)
            }
            break
          }
          case 'simplebar':
            if (!document.querySelector('link[href*="simplebar.css"]')) {
              await this.loadStylesheet(
                new URL(
                  'simplebar/dist/simplebar.css',
                  import.meta.url
                ).toString()
              )
            }
            this.modules[moduleName] = (await import('simplebar')).default
            break

          // Add other modules here as needed

          // case 'flatpickr':
          //   if (!document.querySelector('link[href*="flatpickr.min.css"]')) {
          //     await this.loadStylesheet(
          //       new URL(
          //         'flatpickr/dist/flatpickr.min.css',
          //         import.meta.url
          //       ).toString()
          //     )
          //   }
          //   this.modules[moduleName] = (await import('flatpickr')).default
          //   break
          // case 'intl-tel-input':
          //   if (!document.querySelector('link[href*="intlTelInput.css"]')) {
          //     await this.loadStylesheet(
          //       new URL(
          //         'intl-tel-input/build/css/intlTelInput.css',
          //         import.meta.url
          //       ).toString()
          //     )
          //   }
          //   this.modules[moduleName] = (await import('intl-tel-input')).default
          //   break
          // case 'noUiSlider':
          //   if (!document.querySelector('link[href*="nouislider.css"]')) {
          //     await this.loadStylesheet(
          //       new URL(
          //         'nouislider/dist/nouislider.css',
          //         import.meta.url
          //       ).toString()
          //     )
          //   }
          //   this.modules[moduleName] = (await import('nouislider')).default
          //   break
          default:
            throw new Error(`Unknown module: ${moduleName}`)
        }
      } catch (error) {
        console.error(`Error loading module "${moduleName}":`, error)
        throw error
      }
    }
    return this.modules[moduleName]
  }

  private async loadStylesheet(url: string): Promise<HTMLLinkElement> {
    return new Promise((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
      link.onload = () => resolve(link)
    })
  }

  /**
   * Получение ранее загруженного модуля.
   * @param {string} moduleName - Название модуля.
   * @return {any} Загруженный модуль.
   */
  public getModule(moduleName: string): any {
    const module = this.modules[moduleName]
    if (!module) {
      throw new Error(`Module "${moduleName}" is not loaded yet.`)
    }
    return module
  }

  /**
   * Проверка, загружен ли модуль.
   * @param {string} moduleName - Название модуля.
   * @return {boolean} True, если модуль загружен, иначе false.
   */
  public isModuleLoaded(moduleName: string): boolean {
    return !!this.modules[moduleName]
  }

  /**
   * Удаление загруженного модуля из кэша.
   * @param {string} moduleName - Название модуля.
   */
  public unloadModule(moduleName: string): void {
    if (this.modules[moduleName]) {
      delete this.modules[moduleName]
      console.log(`Module "${moduleName}" has been unloaded.`)
    } else {
      console.warn(`Module "${moduleName}" was not loaded.`)
    }
  }
}
class ScrollController {
  private core: Core
  private lastDirection: number
  public header = document.querySelector('header')
  public footer = document.querySelector('footer')
  private scrollToTop: HTMLElement | null =
    document.querySelector('[data-scroll-top]')
  private pageAnchors: HTMLElement | null =
    document.querySelector('.page-anchors')
  private scrollDirection: 'up' | 'down' = null
  private tocPanel: HTMLElement | null =
    document.querySelector('[data-toc-mobile]')

  constructor(core: Core) {
    this.lastDirection = 1
    this.core = core
  }

  public async initialize(): Promise<void> {
    const moduleNames = []

    // Ожидаем загрузки всех модулей перед продолжением
    await Promise.all(
      moduleNames.map((mn) => this.core.moduleManager.loadModule(mn))
    )

    window.addEventListener('scroll', () => {
      this.handleScroll()
    })
    this.lastDirection = window.scrollY

    // Инициализация якорей
    this.initAnchors()
  }

  public getScrollDirection(): 'up' | 'down' {
    return this.scrollDirection
  }

  /**
   * Инициализация якорей.
   */
  private initAnchors(): void {
    // const hash = window.location.hash

    document.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest(
        '[data-scroll-top] button'
      )
      if (button) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })

    document.addEventListener('click', (event) => {
      const anchor = (event.target as HTMLElement).closest(
        'a[href^="#"], a[href^="/#"]'
      ) as HTMLElement | null

      if (anchor) {
        event.preventDefault()
        document.body.classList.remove('locked')
        // const burger = document.querySelector('.header__burger') as HTMLElement
        // if (burger) {
        //   burger.toggleInstance?.toggleToClass('is-menu-close')
        // }

        const href = anchor.getAttribute('href')
        const targetId = href?.replace(/^\//, '')
        const targetElement = document.querySelector(targetId) as HTMLElement

        const currentScrollY =
          targetElement.getBoundingClientRect().top + window.scrollY
        const direction =
          // eslint-disable-next-line no-nested-ternary
          currentScrollY > this.lastDirection
            ? 1
            : currentScrollY < this.lastDirection
              ? -1
              : 0
        this.setDirection(direction)

        this.scrollTo(targetElement, href)
      }
    })
  }

  public scrollTo(
    targetElement: HTMLElement,
    href?: string,
    behavior: ScrollBehavior = 'smooth'
  ): void {
    const currentPath = window.location.pathname + window.location.hash

    if (href?.startsWith('/#') && !currentPath.includes(href)) {
      window.location.href = href
    } else if (targetElement) {
      const styles = getComputedStyle(targetElement)
      let scrollPaddingTop: string = styles.scrollPaddingTop

      let headerHeight = this.header.offsetHeight
      // this.header && this.scrollDirection === 'up'
      //   ? this.header.offsetHeight
      //   : 0
      if (
        this.scrollDirection === 'down' &&
        this.header?.classList.contains('header--hidden-top')
      ) {
        headerHeight = 0
      }

      const pageAnchorsHeight = this.pageAnchors
        ? this.pageAnchors.offsetHeight
        : 0
      const tocPanelHeight = this.tocPanel ? this.tocPanel.offsetHeight : 0
      const headerTopHeight =
        !this.header?.classList.contains('header--hidden-top') &&
        this.scrollDirection === 'up'
          ? (this.header?.querySelector('.header__top') as HTMLElement)
              ?.offsetHeight || 0
          : 0

      if (isNaN(parseInt(scrollPaddingTop, 10))) {
        scrollPaddingTop = '0'
      }

      window.scrollTo({
        top:
          targetElement.getBoundingClientRect().top +
          window.scrollY -
          parseInt(scrollPaddingTop, 10) -
          headerHeight -
          tocPanelHeight -
          pageAnchorsHeight +
          headerTopHeight -
          HEADER_MAIN_GAP,
        behavior
      })
    }
  }

  private setDirection(direction: number): void {
    if (
      // getScrollState() &&
      direction !== 0 &&
      direction !== (this.scrollDirection === 'down' ? 1 : -1)
    ) {
      document.body.classList.toggle('scrolling-down', direction > 0)
      document.body.classList.toggle('scrolling-up', direction < 0)
      document.body.dispatchEvent(
        new CustomEvent('scroll:directionchanged', {
          detail: { direction: direction > 0 ? 'down' : 'up' }
        })
      )
    }

    this.scrollDirection = direction > 0 ? 'down' : 'up'
  }

  /**
   * Обработка события прокрутки.
   */
  private handleScroll(): void {
    const currentScrollY = window.scrollY
    const direction =
      // eslint-disable-next-line no-nested-ternary
      currentScrollY > this.lastDirection
        ? 1
        : currentScrollY < this.lastDirection
          ? -1
          : 0
    this.setDirection(direction)
    this.lastDirection = currentScrollY

    if (currentScrollY === 0) {
      document.body.classList.remove('scrolling-up', 'scrolling-down')
    }
    // Check header intersection with footer
    if (this.header && this.footer) {
      let isIntersecting = this.footer.getBoundingClientRect().top < 0
      this.header.classList.toggle('is-hidden', isIntersecting)
    }

    if (this.scrollToTop) {
      const windowHeight = window.innerHeight * 0.5
      if (
        currentScrollY > windowHeight &&
        this.footer.getBoundingClientRect().top >
          this.scrollToTop.getBoundingClientRect().top
      ) {
        this.scrollToTop.classList.add('is-active')
      } else {
        this.scrollToTop.classList.remove('is-active')
      }
    }
  }
}
class ViewportController {
  private header: HTMLElement
  private headerTop: HTMLElement
  private footer: HTMLElement

  constructor() {
    this.header = document.querySelector('header')
    this.headerTop = this.header?.querySelector('.header__top') as HTMLElement
    this.footer = document.querySelector('footer')

    this.updateViewportSize()
    this.updateHeaderFooterHeights()

    window.addEventListener(
      'resize',
      debounce(() => {
        this.updateViewportSize()
        this.updateHeaderFooterHeights()
      }, 300)
    )
  }

  /**
   * Обновляет размеры области просмотра.
   */
  private updateViewportSize(): void {
    const vh = window.innerHeight * 0.01
    const vw = document.body.clientWidth * 0.01
    const barWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.setProperty('--doc-height', `${vh}px`)
    document.documentElement.style.setProperty('--doc-width', `${vw}px`)
    document.documentElement.style.setProperty(
      '--scrollbar-width',
      `${barWidth}px`
    )
  }

  /**
   * Обновляет высоты заголовка и подвала.
   */
  private updateHeaderFooterHeights(): void {
    if (this.header && this.footer) {
      document.documentElement.style.setProperty(
        '--header-height',
        `${this.header.offsetHeight}px`
      )
      document.documentElement.style.setProperty(
        '--footer-height',
        `${this.footer.offsetHeight}px`
      )
    }

    if (this.headerTop) {
      document.documentElement.style.setProperty(
        '--header-top-height',
        `${this.headerTop.offsetHeight}px`
      )
    }
  }

  public update(): void {
    this.updateViewportSize()
    this.updateHeaderFooterHeights()
  }
}
class MetaViewportController {
  constructor() {
    this.updateMetaViewport()
    window.addEventListener(
      'resize',
      debounce(this.updateMetaViewport.bind(this), 300)
    )
  }

  /**
   * Обновляет мета-тег viewport.
   */
  private updateMetaViewport(): void {
    const metaViewport = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null
    if (window.screen.width < 393) {
      metaViewport.content = `width=${window.screen.width}, initial-scale=1`
    } else {
      metaViewport.content = 'width=device-width, initial-scale=1'
    }
  }
}

class Core {
  private static instance: Core
  public moduleManager: ModuleManager
  // public swiperManager: SwiperManager
  public scrollController: ScrollController
  public viewportController: ViewportController
  public metaViewportController: MetaViewportController

  private constructor() {
    this.moduleManager = ModuleManager.getInstance(this)
    // this.swiperManager = SwiperManager.getInstance(this)
    this.scrollController = new ScrollController(this)
    this.viewportController = new ViewportController()
    this.metaViewportController = new MetaViewportController()
  }
  public static getInstance(): Core {
    if (!this.instance) {
      this.instance = new Core()
    }
    return this.instance
  }

  /**
   * Инициализация Core.
   * @return {Promise<void>} Промис, который разрешается после инициализации.
   */
  public async init(): Promise<void> {
    await this.scrollController.initialize()
    await this.moduleManager.loadModule('simplebar')
    this.initUserInteractionWatcher()
  }

  private initUserInteractionWatcher(): void {
    const onFirstInteraction = async () => {
      document.removeEventListener('mousemove', onFirstInteraction)
      document.removeEventListener('mousedown', onFirstInteraction)
      document.removeEventListener('keydown', onFirstInteraction)
      document.removeEventListener('scroll', onFirstInteraction)
      document.removeEventListener('touchstart', onFirstInteraction)

      // TODO: Возможно стоит добавить подгрузку heavy-модулей
      await Promise.all([
        this.moduleManager.loadModule('simplebar')
        // this.moduleManager.loadModule('gsap'),
        // this.moduleManager.loadModule('lenis')
      ])

      // await this.swiperManager.initAllSwipers()
      Modals.getInstance().subscribeToMedia()
    }

    document.addEventListener('mousemove', onFirstInteraction, { once: true })
    document.addEventListener('mousedown', onFirstInteraction, { once: true })
    document.addEventListener('keydown', onFirstInteraction, { once: true })
    document.addEventListener('scroll', onFirstInteraction, { once: true })
    document.addEventListener('touchstart', onFirstInteraction, { once: true })
  }
}
export default Core
