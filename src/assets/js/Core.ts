/* eslint-disable no-console */
import { copyToClipboard } from './utils/helpers'

declare global {
  export interface Window {
    lenis: any
    ResizeObserver: any
    copyToClipboard: (_url: string) => void
  }
}

/**
 * ModalManager - класс для управления модальными окнами.
 * Предоставляет функции для открытия, закрытия и управления состоянием модальных окон.
 * TODO: Добавить более гибкое решение для динамичной высоты и позиции модальных окон.
 */
class ModalManager {
  private static instance: ModalManager
  private modals: Map<HTMLElement, boolean> // Карта модальных окон и их состояния (открыто/закрыто).
  private core: Core

  /**
   * Приватный конструктор для реализации Singleton.
   * @param {Core} core - Экземпляр Core.
   */
  private constructor(core: Core) {
    this.core = core
    this.modals = new Map()
    this.init()
  }

  /**
   * Получить единственный экземпляр ModalManager.
   * @param {Core} core - Экземпляр Core.
   * @return {ModalManager} Экземпляр ModalManager.
   */
  public static getInstance(core: Core): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager(core)
    }
    return ModalManager.instance
  }

  /**
   * Инициализация управления модальными окнами.
   */
  private init(): void {
    // Инициализация кнопок с атрибутом [data-modal].
    document.querySelectorAll('[data-modal]').forEach((button) => {
      this.setupAccessibility(button)
      button.addEventListener('click', (event) => this.handleButtonClick(event))
    })

    // Закрытие модального окна при клике вне его контента.
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.classList.contains('modal-wrapper')) {
        this.closeModal()
      }
    })

    // Закрытие модального окна при нажатии клавиши Escape.
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeModal()
      }
    })
  }

  /**
   * Устанавливает атрибуты доступности для кнопок, связанных с модальными окнами.
   * @param {Element} button - Кнопка, связанная с модальным окном.
   */
  private setupAccessibility(button: Element): void {
    const modalData = button.getAttribute('data-modal')
    if (modalData) {
      const [modalSelector] = modalData.split(',')
      const modal = document.querySelector(modalSelector.trim()) as HTMLElement

      if (modal) {
        modal.setAttribute('role', 'dialog')
        modal.setAttribute('aria-hidden', 'true')
        modal.setAttribute('aria-modal', 'true')

        const id =
          modal.id || `modal-${Math.random().toString(36).substr(2, 9)}`
        modal.id = id
        button.setAttribute('aria-controls', id)
        button.setAttribute('aria-expanded', 'false')
      }
    }
  }

  /**
   * Обработка клика по кнопке, связанной с модальным окном.
   * @param {Event} event - Событие клика.
   */
  public handleButtonClick(event: Event): void {
    const button = event.currentTarget as HTMLElement
    const modalData = button.getAttribute('data-modal')

    if (modalData) {
      const [modalSelector, action] = modalData.split(',')
      const modal = document.querySelector(modalSelector.trim()) as HTMLElement

      if (modal) {
        if (action.trim() === '1') {
          this.openModal(modal, button)
        } else if (action.trim() === '0') {
          this.closeSpecificModal(modal, button)
        }
      }
    }
  }

  /**
   * Синхронизирует состояние кнопок, связанных с модальным окном.
   * @param {HTMLElement} modal - Модальное окно.
   * @param {boolean} expanded - Статус открытия (true/false).
   */
  public syncButtonState(modal: HTMLElement, expanded: boolean): void {
    document
      .querySelectorAll(`[data-modal*="${modal.id}"]`)
      .forEach((button) => {
        button.setAttribute('aria-expanded', expanded.toString())
      })
  }

  /**
   * Открывает модальное окно.
   * @param {HTMLElement} modal - Модальное окно.
   * @param {HTMLElement} button - Кнопка, связанная с модальным окном.
   */
  public openModal(modal: HTMLElement, button: HTMLElement): void {
    this.syncButtonState(modal, true)
    modal.setAttribute('aria-hidden', 'false')
    button.setAttribute('aria-expanded', 'true')

    // Блокировка прокрутки страницы.
    this.core.scrollController.lenis.stop()
    document.body.classList.add('locked')

    // Показ модального окна.
    modal.classList.add('is-visible')

    this.modals.set(modal, true)
  }

  /**
   * Закрывает конкретное модальное окно.
   * @param {HTMLElement} modal - Модальное окно.
   * @param {HTMLElement} button - Кнопка, связанная с модальным окном.
   */
  private closeSpecificModal(modal: HTMLElement, button: HTMLElement): void {
    this.syncButtonState(modal, false)
    modal.setAttribute('aria-hidden', 'true')
    button.setAttribute('aria-expanded', 'false')
    modal.classList.remove('is-visible')

    this.modals.delete(modal)

    // Разблокировка прокрутки страницы.
    this.core.scrollController.lenis.start()
    document.body.classList.remove('locked')
  }

  /**
   * Закрывает все открытые модальные окна.
   */
  public closeModal(): void {
    const visibleModals = Array.from(this.modals.keys()).filter((modal) =>
      modal.classList.contains('is-visible')
    )
    visibleModals.forEach((modal) => {
      modal.setAttribute('aria-hidden', 'true')
      modal.classList.remove('is-visible')

      this.syncButtonState(modal, false)
    })

    // Разблокировка прокрутки страницы.
    this.core.scrollController.lenis.start()
    document.body.classList.remove('locked')

    this.modals.clear()
  }
}
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
                  case 'Keyboard':
                    const { Keyboard } = await import('swiper/modules')
                    modulesToUse.push(Keyboard)
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
          case 'floating-ui': {
            this.modules[moduleName] = await import('@floating-ui/dom')
            break
          }
          case 'gsap':
            const gsap = (await import('gsap')).gsap
            this.modules[moduleName] = gsap
            break
          case 'lenis':
            this.modules[moduleName] = (await import('lenis')).default
            break
          case 'ScrollTrigger':
            // Проверяем, загружен ли gsap
            let gsapInstance = this.modules['gsap']
            if (!gsapInstance) {
              gsapInstance = (await import('gsap')).gsap
              this.modules['gsap'] = gsapInstance
            }
            const { ScrollTrigger } = await import('gsap/ScrollTrigger')
            gsapInstance.registerPlugin(ScrollTrigger)
            this.modules[moduleName] = ScrollTrigger
            break
          case 'SlimSelect':
            // Динамическая вставка стилей через <link>, если они ещё не загружены
            if (!document.querySelector('link[href*="slimselect.css"]')) {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = new URL(
                '/node_modules/slim-select/dist/slimselect.css',
                import.meta.url
              ).toString()
              document.head.appendChild(link)
            }
            this.modules[moduleName] = (await import('slim-select')).default
            break
          case 'simplebar':
            if (!document.querySelector('link[href*="simplebar.css"]')) {
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = new URL(
                'simplebar/dist/simplebar.css',
                import.meta.url
              ).toString()
              document.head.appendChild(link)
            }
            this.modules[moduleName] = (await import('simplebar')).default
            break
          case 'splitting':
            this.modules[moduleName] = (await import('splitting')).default
            break
          case 'slugify':
            this.modules[moduleName] = (await import('slugify')).default
            break
          case 'vanilla-cookieconsent':
            this.modules[moduleName] = await import('vanilla-cookieconsent')
            break
          case 'intl-tel-input':
            this.modules[moduleName] = (await import('intl-tel-input')).default
            break
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
  public lenis: any
  private lastDirection: number
  public header = document.querySelector('header')
  public footer = document.querySelector('footer')
  public showreel = document.querySelector('showreel')

  constructor(core: Core) {
    this.lastDirection = 1
    this.core = core
  }

  public async initialize(): Promise<void> {
    const moduleNames = ['lenis', 'gsap', 'ScrollTrigger']

    // Ожидаем загрузки всех модулей перед продолжением
    await Promise.all(
      moduleNames.map((mn) => this.core.moduleManager.loadModule(mn))
    )

    const gsap = this.core.moduleManager.getModule('gsap')
    const Lenis = this.core.moduleManager.getModule('lenis')
    const ScrollTrigger = this.core.moduleManager.getModule('ScrollTrigger')

    // Инициализация Lenis и привязка событий
    this.lenis = new Lenis({
      syncTouch: true,
      syncTouchLerp: 0.1,
      touchInertiaMultiplier: 12,
      smoothWheel: true
    })

    this.lenis.on('scroll', () => {
      this.handleScroll()
      ScrollTrigger.update()
    })

    // Привязываем lenis к gsap
    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)
    this.lastDirection = window.scrollY

    // Инициализация якорей
    this.initAnchors()
  }

  /**
   * Инициализация якорей.
   */
  private initAnchors(): void {
    const hash = window.location.hash

    document.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest('[data-scroll-top]')
      if (button) {
        this.lenis.scrollTo(0, {
          easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
          duration: 2
        })
      }
    })

    document.addEventListener('click', (event) => {
      const anchor = (event.target as HTMLElement).closest(
        'a[href^="#"], a[href^="/#"]'
      )
      if (anchor) {
        event.preventDefault()
        document.body.classList.remove('locked')

        const burger = document.querySelector('.header__burger') as HTMLElement
        if (burger) {
          burger.toggleInstance.toggleToClass('is-menu-close')
        }

        const href = anchor.getAttribute('href')
        const targetId = href?.replace(/^\//, '')
        const targetElement = document.querySelector(targetId)
        const currentPath = window.location.pathname + window.location.hash

        if (href?.startsWith('/#') && !currentPath.includes(href)) {
          window.location.href = href
        } else if (targetElement) {
          this.core.modalManager.closeModal()
          const styles = getComputedStyle(targetElement)
          let scrollPaddingTop: string = styles.scrollPaddingTop

          if (isNaN(parseInt(scrollPaddingTop, 10))) {
            scrollPaddingTop = '0'
          }

          this.lenis.scrollTo(targetElement, {
            offset: -parseInt(scrollPaddingTop, 10)
          })
        }
      }
    })

    // Если есть hash в URL, скроллим к нужному элементу
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        setTimeout(() => {
          this.lenis.scrollTo(target)
        }, 300)
      }
    }
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

    if (direction !== 0 && direction !== this.lastDirection) {
      document.body.classList.toggle('scrolling-down', direction > 0)
      document.body.classList.toggle('scrolling-up', direction < 0)
      this.lastDirection = currentScrollY
    }

    if (currentScrollY === 0) {
      document.body.classList.remove('scrolling-up', 'scrolling-down')
    }
    // Check header intersection with elements
    if (this.header && this.footer && this.showreel) {
      const elementsToCheck = [this.footer, this.showreel]
      const headerRect = this.header.getBoundingClientRect()

      let isIntersecting = false

      elementsToCheck.forEach((el) => {
        const elRect = el.getBoundingClientRect()

        if (
          headerRect.bottom >= elRect.top &&
          headerRect.top <= elRect.bottom
        ) {
          isIntersecting = true
        }
      })

      if (isIntersecting) {
        this.header.style.opacity = '0'
        this.header.style.pointerEvents = 'none'
      } else {
        this.header.style.opacity = '1'
        this.header.style.pointerEvents = 'auto'
      }
    }
  }
}
class ViewportController {
  private header: HTMLElement
  private footer: HTMLElement
  constructor() {
    this.header = document.querySelector('header')
    this.footer = document.querySelector('footer')
    this.updateViewportSize()
    this.updateHeaderFooterHeights()

    window.addEventListener('resize', () => {
      this.updateViewportSize()
      this.updateHeaderFooterHeights()
    })
  }

  /**
   * Обновляет размеры области просмотра.
   */
  private updateViewportSize(): void {
    const vh = window.innerHeight * 0.01
    const vw = document.body.clientWidth * 0.01
    document.documentElement.style.setProperty('--doc-height', `${vh}px`)
    document.documentElement.style.setProperty('--doc-width', `${vw}px`)
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
  }
}
class MetaViewportController {
  constructor() {
    this.updateMetaViewport()
    window.addEventListener('resize', this.updateMetaViewport)
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
  public modalManager: ModalManager
  public scrollController: ScrollController
  public viewportController: ViewportController
  public metaViewportController: MetaViewportController

  private constructor() {
    this.moduleManager = ModuleManager.getInstance(this)
    this.modalManager = ModalManager.getInstance(this)
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
    await this.initializeSimpleBar()
    window.copyToClipboard = copyToClipboard
  }

  /**
   * Инициализация SimpleBar.
   * @return {Promise<void>} Промис, который разрешается после инициализации SimpleBar.
   */
  private async initializeSimpleBar(): Promise<void> {
    await this.moduleManager.loadModule('simplebar')
    const SimpleBar = this.moduleManager.getModule('simplebar')
    const elements = [
      ...document.querySelectorAll('.modal.modal--toc'),
      ...document.querySelectorAll('.breadcrumbs')
    ]
    elements.forEach((el: HTMLElement) => {
      new SimpleBar(el, { autoHide: true })
      el.style.overflow = 'unset'
    })
  }
}
export default Core
