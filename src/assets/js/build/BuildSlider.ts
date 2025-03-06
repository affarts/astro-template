import type { SwiperOptions, Swiper } from 'swiper/types'
import { debounce } from '../utils/global'
import Core from '../Core'
/**
 * Синглтон для управления экземплярами Swiper.
 */
export class SwiperManager {
  private static instance: SwiperManager // Экземпляр синглтона
  private core: Core
  public sliders: {
    [key: string]: {
      swiper: Swiper | undefined
      swiperConfig: SwiperOptions
      swiperContainer: HTMLElement
      media?: string
      events?: {
        onAddSwiper?: (_data: { swiperContainer: HTMLElement }) => void
      }
    }
  } = {}

  /**
   * Приватный конструктор для предотвращения прямой инстанциации.
   */
  private constructor() {
    this.sliders = {}
    this.core = Core.getInstance()
    window.addEventListener(
      'resize',
      debounce(this.handleResize.bind(this), 1500)
    )
  }

  /**
   * Публичный метод для доступа к экземпляру синглтона.
   * @return {SwiperManager} Экземпляр синглтона SwiperManager.
   */
  public static getInstance(): SwiperManager {
    if (!SwiperManager.instance) {
      SwiperManager.instance = new SwiperManager()
    }
    return SwiperManager.instance
  }

  /**
   * Настраивает DOM-структуру для Swiper.
   * @param {string} key - Уникальный ключ для идентификации слайдера.
   * @param {HTMLElement} swiperContainer - Контейнер для слайдера.
   */
  private setupSwiperDOM(key: string, swiperContainer: HTMLElement): void {
    if (!swiperContainer) return

    if (!swiperContainer.querySelector('.swiper-wrapper')) {
      const wrapper = document.createElement('div')
      wrapper.classList.add('swiper-wrapper')

      Array.from(swiperContainer.children).forEach((child) => {
        const slide = document.createElement('div')
        slide.classList.add('swiper-slide')
        slide.appendChild(child)
        wrapper.appendChild(slide)
      })

      swiperContainer.innerHTML = '' // Очистить контейнер
      swiperContainer.appendChild(wrapper) // Добавить обертку в контейнер
      // Обновляем позиции ScrollTrigger
      const ScrollTrigger = this.core.moduleManager.getModule('ScrollTrigger')
      setTimeout(() => {
        ScrollTrigger.refresh()
      }, 1000)
    }
  }

  /**
   * Уничтожает DOM Swiper и восстанавливает исходную структуру.
   * @param {string} key - Уникальный ключ для идентификации слайдера.
   */
  private destroySwiperDOM(key: string): void {
    const { swiper, swiperContainer } = this.sliders[key]

    if (swiper) {
      swiper.destroy(true, true) // Не удалять экземпляр Swiper
      const wrapper =
        swiperContainer.querySelector<HTMLElement>('.swiper-wrapper')
      if (wrapper) {
        Array.from(wrapper.children).forEach((slide) => {
          const firstChild = slide.firstElementChild
          if (firstChild) {
            swiperContainer.appendChild(firstChild)
          }
        })

        wrapper.remove()
      }
    }
  }

  /**
   * Инициализирует или уничтожает экземпляр Swiper в зависимости от размера окна.
   * @param {string} key - Уникальный ключ для идентификации слайдера.
   * @param {Object} options - Опции для инициализации Swiper.
   * @param {SwiperOptions} options.swiperConfig - Конфигурация Swiper.
   * @param {HTMLElement} options.swiperContainer - Контейнер для слайдера.
   * @param {string} options.media - Медиа-запрос для активации Swiper.
   */
  public addSwiper(
    key: string,
    options: {
      swiperConfig: SwiperOptions
      swiperContainer: HTMLElement
      media?: string
      events?: any
    }
  ): void {
    const { swiperConfig, swiperContainer, media, events } = options
    if (!swiperContainer) return
    const swiperIsActive = media ? window.matchMedia(media).matches : true
    if (swiperIsActive && !this.sliders[key]) {
      const observer = new IntersectionObserver(async ([entry]) => {
        if (entry.isIntersecting) {
          swiperContainer.classList.remove('locked')
          this.setupSwiperDOM(key, swiperContainer)
          await this.core.moduleManager.loadModule('swiper', {
            useModules: ['Navigation', 'Pagination']
          })
          const SwiperModule = this.core.moduleManager.getModule('swiper')
          const swiperInstance = new SwiperModule(swiperContainer, swiperConfig)
          this.sliders[key] = {
            ...options,
            swiper: swiperInstance
          }
          setTimeout(() => {
            this.core.moduleManager.getModule('ScrollTrigger').refresh()
          }, 300)
          observer.unobserve(swiperContainer)
        }
      })
      observer.observe(swiperContainer)
      events?.onAddSwiper?.(swiperContainer)
    } else {
      this.sliders[key] = { ...options, swiper: null }
      this.destroySwiperDOM(key)
    }
  }

  /**
   * Обрабатывает событие изменения размера окна.
   */
  private handleResize(): void {
    const SwiperModule = this.core.moduleManager.getModule('swiper')
    if (!SwiperModule) return
    for (const [key, options] of Object.entries(this.sliders)) {
      const { swiperConfig, swiperContainer, media } = options
      const swiperCanActivated = media ? window.matchMedia(media).matches : true
      if (swiperCanActivated) {
        this.setupSwiperDOM(key, swiperContainer)
        this.sliders[key] = {
          ...options,
          swiper: new SwiperModule(swiperContainer, swiperConfig)
        }
      } else {
        this.destroySwiperDOM(key)
        this.sliders[key] = { ...options, swiper: null }
      }
    }
  }
}
