import { lockFocus, unlockFocus } from '@scripts/utils/focus-lock'
import { disablePageScroll, enablePageScroll } from '@fluejs/noscroll'
import { mediaMobile } from '@scripts/utils/const'
import { initSimplebar, resetSimplebar } from '@scripts/utils/helpers'

/**
 * Интерфейс конфигурации модального окна.
 * @property {boolean} [preventDefault=true] - Отключить стандартное поведение события.
 * @property {boolean} [lockFocus=true] - Заблокировать фокус внутри модального окна.
 * @property {boolean} [startFocus=true] - Установить фокус на первый элемент внутри модального окна.
 * @property {boolean} [focusBack=false] - Вернуть фокус на элемент, вызвавший модальное окно.
 * @property {boolean} [resetScrollPos=false] - Сбросить позицию прокрутки страницы.
 * @property {number} [eventTimeout=500] - Таймаут для выполнения событий (в миллисекундах).
 * @property {(event: MouseEvent | null) => void | null} [openCallback] - Колбэк, вызываемый при открытии модального окна.
 * @property {() => void | null} [closeCallback] - Колбэк, вызываемый при закрытии модального окна.
 */
interface IModalConfig {
  preventDefault?: boolean
  lockFocus?: boolean
  startFocus?: boolean
  focusBack?: boolean
  resetScrollPos?: boolean
  eventTimeout?: number
  openCallback?: (_event: MouseEvent | null) => void | null
  closeCallback?: () => void | null
  autoShow?: boolean
  autoShowDelay?: number
  scrollBar?: boolean
  openPrevious?: boolean
  openOver?: boolean
}

export class Modals {
  private currentModalName: string | null = null
  private modalsStack: string[] = []
  private static instance: Modals
  private static configs: Map<string, IModalConfig> = new Map()
  private mediaQuery = mediaMobile()
  private autoShowTimer: ReturnType<typeof setTimeout> | null = null
  private isAutoShowPaused: boolean = false

  /**
   * Конструктор класса Modals.
   * Инициализирует модальные окна.
   */
  private constructor() {
    this.init()
  }

  /**
   * Инициализирует модальные окна.
   */
  private init(): void {
    this.clearPreload()
    this.initTriggers()
  }

  /**
   * Проверяет медиазапросы и подписывается на изменения.
   */
  public subscribeToMedia(): void {
    this.checkMedia()
    this.mediaQuery.addEventListener('change', this.checkMedia)
  }

  /**
   * Инициализирует триггеры для открытия модальных окон.
   */
  private initTriggers(): void {
    const triggers = document.querySelectorAll('[data-open-modal]')
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', this.triggerClickHandler)
    })
  }

  /**
   * Возвращает единственный экземпляр класса Modals.
   * @return {Modals} Экземпляр класса Modals.
   */
  public static getInstance(): Modals {
    if (!this.instance) {
      this.instance = new Modals()
    }
    return this.instance
  }

  /**
   * Добавляет конфигурацию для модального окна.
   * @param {string} name - Имя модального окна.
   * @param {IModalConfig} config - Конфигурация модального окна.
   * @param {boolean} [force=false] - Принудительно добавить модальное окно, даже если оно уже существует.
   */
  public addModal(
    name: string,
    config: IModalConfig,
    force: boolean = false
  ): void {
    if (!force && Modals.configs.has(name)) {
      // eslint-disable-next-line no-console
      console.debug(
        `modal "${name}" is already added`,
        Modals.configs.get(name)
      )
      return
    }

    Modals.configs.set(name, {
      preventDefault: true,
      lockFocus: true,
      startFocus: true,
      focusBack: false,
      resetScrollPos: false,
      eventTimeout: 500,
      scrollBar: true,
      openOver: false,
      ...config
    })

    if (config.autoShow) {
      this.setAutoShow(name, config.autoShowDelay)
    }
  }

  public removeModal(name: string): void {
    if (Modals.configs.has(name)) {
      Modals.configs.delete(name)
    } else {
      // eslint-disable-next-line no-console
      console.warn(`Modal with name "${name}" does not exist.`)
    }
  }

  private setAutoShow(modal: string, delay: number) {
    this.autoShowTimer = setTimeout(() => {
      if (this.currentModalName || this.isAutoShowPaused) {
        clearTimeout(this.autoShowTimer)
        this.setAutoShow(modal, delay)
        return
      }

      this.openModal(modal)
    }, delay || 0)
  }

  public pauseAutoShow(): void {
    if (this.autoShowTimer) {
      this.isAutoShowPaused = true
    }
  }

  public resumeAutoShow(): void {
    if (this.isAutoShowPaused && this.autoShowTimer) {
      this.isAutoShowPaused = false
    }
  }

  /**
   * Обработчик клика по триггеру открытия модального окна.
   * @param {MouseEvent} event - Событие клика.
   */
  private triggerClickHandler = (event: MouseEvent): void => {
    event.preventDefault()

    const target = (event.target as HTMLElement).closest(
      '[data-open-modal]'
    ) as HTMLElement
    const modalName = target.dataset.openModal

    if (modalName) {
      this.openModal(modalName, event)
    }
  }

  /**
   * Добавляет триггер для открытия модального окна.
   * @param {HTMLElement} trigger - Элемент-триггер.
   */
  public addTrigger(trigger: HTMLElement): void {
    trigger.addEventListener('click', this.triggerClickHandler)
  }

  /**
   * Убирает состояние preload у модальных окон.
   */
  private clearPreload(): void {
    const modalElements = document.querySelectorAll('.modal')
    if (modalElements.length) {
      modalElements.forEach((el) => {
        setTimeout(() => {
          el.classList.remove('modal--preload')
        }, 100)
      })
    }
  }

  /**
   * Добавляет обработчики событий для модального окна.
   * @param {HTMLElement} modal - Элемент модального окна.
   * @param {boolean} [noKeydown=false] - Если true, не добавляет обработчик клавиатуры.
   */
  private addListeners(modal: HTMLElement, noKeydown: boolean = false): void {
    modal.addEventListener('click', this.onModalClickHandler)

    if (!noKeydown) {
      document.addEventListener('keydown', this.onModalKeyboardHandler)
    }
  }

  /**
   * Удаляет обработчики событий с модального окна.
   * @param {HTMLElement} modal - Элемент модального окна.
   * @param {boolean} [noKeydown=false] - Если true, не удаляет обработчик клавиатуры.
   */
  private removeListeners(
    modal: HTMLElement,
    noKeydown: boolean = false
  ): void {
    modal.removeEventListener('click', this.onModalClickHandler)

    if (!noKeydown) {
      document.removeEventListener('keydown', this.onModalKeyboardHandler)
    }
  }

  /**
   * Обработчик клика внутри модального окна.
   * Закрывает модальное окно, если клик был по элементу с атрибутом `data-close-modal`.
   * @param {MouseEvent} event - Событие клика.
   */
  private onModalClickHandler = (event: MouseEvent): void => {
    const closeTrigger = (event.target as HTMLElement).closest(
      '[data-close-modal]'
    ) as HTMLElement

    if (!closeTrigger) {
      return
    }

    const config = Modals.configs.get(this.currentModalName)

    this.closeModal(
      this.currentModalName,
      closeTrigger.dataset.closeModal === 'back' ||
        (config?.openPrevious && !config?.openOver)
    )
  }

  /**
   * Обработчик событий клавиатуры для модального окна.
   * Закрывает модальное окно при нажатии клавиши Escape.
   * @param {KeyboardEvent} event - Событие клавиатуры.
   */
  private onModalKeyboardHandler = (event: KeyboardEvent): void => {
    const isEscKey = event.key === 'Escape' || event.key === 'Esc'

    const config = Modals.configs.get(this.currentModalName)

    if (isEscKey) {
      event.preventDefault()
      this.closeModal(
        this.currentModalName,
        config?.openPrevious || config?.openOver || false
      )
    }
  }

  /**
   * Открывает модальное окно с указанным именем.
   * @param {string} modalName - Имя модального окна.
   * @param {MouseEvent} [event=null] - Событие, вызвавшее открытие.
   */
  public openModal(modalName: string, event: MouseEvent = null): void {
    if (!Modals.configs.has(modalName)) {
      // eslint-disable-next-line no-console
      console.warn(`Modal with name "${modalName}" is not configured.`)
      return
    }

    const modal = document.querySelector(
      `[data-modal="${modalName}"]`
    ) as HTMLElement

    if (!modal || modal.classList.contains('is-active')) {
      return
    }

    this.currentModalName = modalName
    const config = Modals.configs.get(modalName)

    const openedModal = document.querySelector(
      '.modal.is-active'
    ) as HTMLElement
    if (!config.openOver && openedModal) {
      this.closeModalImpl({
        modalName: openedModal.dataset.modal,
        clearStack: false,
        checkModalBack: false
      })
    }

    if (config.openOver) {
      modal.style.zIndex = '1100'
    }

    modal.classList.add('is-active')
    disablePageScroll()
    // disablePageScroll(
    //   this.mediaQuery.matches
    //     ? (modal.querySelector('.modal__content') as HTMLElement)
    //     : null
    // )

    config.openCallback?.(event)

    if (config.lockFocus) {
      lockFocus(modal, config.startFocus)
    }

    const modalBackBtn = modal.querySelector(
      '[data-close-modal="back"]'
    ) as HTMLButtonElement

    if (modalBackBtn) {
      modalBackBtn.style.display = this.modalsStack.length ? null : 'none'
    }

    this.modalsStack.push(modalName)

    if (config.resetScrollPos) {
      window.scrollTo(0, 0)
    }

    setTimeout(() => {
      this.addListeners(modal, config.openOver)
    }, config.eventTimeout)
  }

  /**
   * Закрывает указанное модальное окно.
   * @param {string} [modalName=this.currentModalName] - Имя модального окна.
   * @param {boolean} [isModalBack] - Указывает, закрывается ли окно кнопкой "Назад".
   */
  public closeModal(
    modalName: string = this.currentModalName,
    isModalBack?: boolean
  ): void {
    this.closeModalImpl({ modalName, isModalBack })
  }

  /**
   * Внутренняя реализация функции закрытия модального окна.
   * @param {Object} options - Опции закрытия.
   * @param {string} options.modalName - Имя модального окна.
   * @param {boolean} [options.clearStack=true] - Очистить стек модальных окон.
   * @param {boolean} [options.checkModalBack=true] - Проверить стек модальных окон.
   * @param {boolean} [options.isModalBack=false] - Закрытие кнопкой "Назад".
   */
  private closeModalImpl({
    modalName = this.currentModalName,
    clearStack = true,
    checkModalBack = true,
    isModalBack = false
  }: {
    modalName: string
    clearStack?: boolean
    checkModalBack?: boolean
    isModalBack?: boolean
  }): void {
    const modal = document.querySelector(
      `[data-modal="${modalName}"]`
    ) as HTMLElement

    if (!modal || !modal.classList.contains('is-active')) {
      return
    }

    const config = Modals.configs.get(modalName)

    modal.classList.remove('is-active')
    this.removeListeners(modal, config.openOver)

    if (config.lockFocus) {
      unlockFocus(config.focusBack)
    }

    config.closeCallback?.()

    setTimeout(() => {
      enablePageScroll()
    }, config.eventTimeout)

    if (this.currentModalName === modalName) {
      this.currentModalName = null
    }

    if (config.openOver) {
      this.modalsStack.pop()
      this.currentModalName = this.modalsStack[this.modalsStack.length - 1]

      setTimeout(() => {
        modal.style.zIndex = null
      }, 500)

      return
    }

    // check if the closeModal needs to work with stack
    if (checkModalBack) {
      if (isModalBack) {
        // pop once for the current modal
        this.modalsStack.pop()

        // check if there is a previous modal
        if (this.modalsStack.length > 0) {
          const prevModalName = this.modalsStack.pop()
          this.openModal(prevModalName)
        }
      } else if (clearStack) {
        this.modalsStack.length = 0
      }
    }
  }

  /**
   * Проверяет медиазапросы и инициализирует/уничтожает Simplebar.
   */
  private checkMedia = async (): Promise<void> => {
    const modalElements = document.querySelectorAll('.modal')

    modalElements.forEach((modal: HTMLElement) => {
      const modalName = modal.dataset.modal
      const config = Modals.configs.get(modalName)

      if (!config || !config.scrollBar) {
        return
      }

      const modalContent = modal.querySelector('.modal__content') as HTMLElement

      if (this.mediaQuery.matches) {
        this.destroySimplebar(modalContent)
      } else {
        this.initSimplebar(modalContent)
      }
    })
  }

  /**
   * Инициализирует Simplebar для элемента.
   * @param {HTMLElement} el - Элемент для инициализации.
   * @param {any} Simplebar - Класс Simplebar.
   */
  private initSimplebar = (el: HTMLElement): void => {
    // removeScrollableTarget(el)

    const options = {
      autoHide: false,
      scrollbarMinSize: 40,
      scrollbarMaxSize: 80
    }

    initSimplebar(el, options)
  }

  /**
   * Уничтожает Simplebar для элемента.
   * @param {HTMLElement} el - Элемент для уничтожения.
   * @param {any} Simplebar - Класс Simplebar.
   */
  private destroySimplebar = (el: HTMLElement): void => {
    resetSimplebar(el)
  }
}
