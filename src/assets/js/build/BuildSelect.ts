import Core from '../Core'

/**
 * Класс BuildInput управляет состоянием полей ввода и их сбросом.
 */
export class BuildSelect {
  private core: Core
  // eslint-disable-next-line no-undef
  private containers: NodeListOf<HTMLElement>

  /**
   * Конструктор класса BuildInput.
   *
   * @param {string} selector - Селектор для контейнеров с полями ввода.
   */
  constructor() {
    this.core = Core.getInstance()
    this.containers = document.querySelectorAll('.main-select')
    this.init() // Инициализация компонента
  }

  /**
   * Инициализация обработчиков событий для контейнеров.
   */
  private init() {
    if (document.querySelector('.main-select')) {
      this.containers.forEach((container) => {
        try {
          const modulePromises = [
            this.core.moduleManager.loadModule('SlimSelect')
          ]
          const loadedModules = Promise.all(modulePromises)
          loadedModules
            .then(() => {
              const SlimSelect = this.core.moduleManager.getModule('SlimSelect')
              const placeholder = container
                .querySelector('[data-placeholder]')
                ?.getAttribute('data-placeholder-text')
              new SlimSelect({
                select: container,
                contentPosition: 'relative', // 'absolute', 'relative' or 'fixed'
                settings: {
                  showSearch: false,
                  placeholderText: placeholder
                }
              })
              // Customize the SlimSelect arrow after initialization
              const arrow =
                container.nextElementSibling.querySelector('.ss-arrow')
              if (arrow) {
                arrow.setAttribute('viewBox', '0 0 30 30')
                arrow.innerHTML = `
                <rect width="30" height="30" rx="15" fill="#F4F4F6"/>
                <path d="M10.3333 13L14.9999 17.6667L19.6666 13" stroke="#1B1E2E" stroke-width="2" stroke-linecap="square"/>
              `
              }
            })
            .catch((error) => {
              // eslint-disable-next-line no-console
              console.error('Error loading modules:', error)
            })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при инициализации модулей:', error)
        }
      })
    }
  }
}
