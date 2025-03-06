import Core from '../Core'

/**
 * Класс BuildInput управляет состоянием полей ввода и их сбросом.
 */
export class BuildInput {
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
    this.containers = document.querySelectorAll('.main-input')
    this.init() // Инициализация компонента
  }

  /**
   * Инициализация обработчиков событий для контейнеров.
   */
  private init() {
    this.containers.forEach((container) => {
      const input =
        container.querySelector('input') || container.querySelector('textarea')
      const reset = container.querySelector('.main-input__reset')

      if (reset) {
        reset.addEventListener('click', () => this.resetInput(input))
      }
      if (input) {
        this.toggleClass(container, input)
        input.addEventListener('input', () =>
          this.toggleClass(container, input)
        )
        container.addEventListener('click', () => input.focus())
      }
      if (container.dataset.telInput) {
        try {
          const modulePromises = [
            this.core.moduleManager.loadModule('intl-tel-input')
          ]
          const loadedModules = Promise.all(modulePromises)
          loadedModules.then(() => {
            const intlInput =
              this.core.moduleManager.getModule('intl-tel-input')
            intlInput(input, {
              initialCountry: 'auto',
              geoIpLookup: (callback) => {
                fetch('https://ipapi.co/json')
                  .then((res) => res.json())
                  .then((data) => callback(data.country_code))
                  .catch(() => callback('ru'))
              },
              strictMode: true,
              allowDropdown: false,
              showFlags: true,
              customPlaceholder: (selectedCountryPlaceholder) =>
                `Телефон: ${selectedCountryPlaceholder}`,
              loadUtilsOnInit: async () => {
                try {
                  const utils = await import('intl-tel-input/utils') // Custom Russian utils
                  return utils
                } catch {
                  // Fallback to full utils only if absolutely needed
                  return import('intl-tel-input/utils')
                }
              }
            })
          })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Ошибка при инициализации модулей:', error)
        }
      }
    })
  }

  /**
   * Сбрасывает значение поля ввода.
   *
   * @param {HTMLInputElement | HTMLTextAreaElement | null} input - Поле ввода для сброса.
   */
  private resetInput(input: HTMLInputElement | HTMLTextAreaElement | null) {
    if (input) {
      input.value = ''
      input.dispatchEvent(new Event('input'))
    }
  }

  /**
   * Переключает класс состояния в зависимости от значения поля ввода.
   *
   * @param {HTMLElement} container - Контейнер, содержащий поле ввода.
   * @param {HTMLInputElement | HTMLTextAreaElement} input - Поле ввода для проверки.
   */
  private toggleClass(
    container: HTMLElement,
    input: HTMLInputElement | HTMLTextAreaElement
  ) {
    container.classList.toggle('is-entered', input.value.trim() !== '')
  }
}
