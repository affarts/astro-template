import { generateID } from '../utils/global'
// Расширяем интерфейс HTMLElement, добавляя свойство toggleInstance
declare global {
  // eslint-disable-next-line no-unused-vars
  export interface HTMLElement {
    toggleInstance?: BuildToggle
  }
}
/**
 * Класс BuildToggle реализует логику переключения состояния целевого элемента через
 * управление классами. При клике на элемент-триггер, класс(ы) у целевого элемента
 * добавляются или удаляются в зависимости от текущего состояния. Также обновляются
 * атрибуты ARIA для повышения доступности
 * TODO Для более гибкой настройки переделать сниппет добавив паттерн Подписок/Observer
 */

/**
 * Интерфейс для конфигурации виджета BuildToggle.
 *
 * @property {string | HTMLElement} trigger - Элемент-триггер, который вызывает изменение состояния.
 * @property {"nextEl" | "prevEl" | "parent" | string | HTMLElement} target - Целевой элемент для переключения классов.
 * @property {Array<string>} toggleClasses - Список классов, которые будут поочередно добавляться/удаляться у целевого элемента.
 * @property {string} [defaultClass] - Класс по умолчанию, который будет добавлен к целевому элементу при инициализации.
 * @property {Array<number | string>} [visibleClasses] - Список индексов или имён классов, которые указывают на видимое состояние элемента.
 * @property {Object} [events] - Объект для определения событий.
 * @property {() => void} [events.onBeforeChange] - Событие, вызываемое перед изменением состояния.
 * @property {() => void} [events.onChange] - Событие, вызываемое после изменения состояния.
 * @property {(event: TransitionEvent) => void} [events.onTargetTransitionEnd] - Событие, вызываемое при завершении CSS-перехода целевого элемента.
 */
interface Config {
  trigger: string | HTMLElement // Элемент, который инициирует переключение
  target: 'nextEl' | 'prevEl' | 'parent' | string | HTMLElement // Целевой элемент для переключения классов
  toggleClasses: Array<string> // Список классов для переключения
  defaultClass?: string // Класс по умолчанию, добавляемый при инициализации
  visibleClasses?: Array<number | string> // Классы для определения видимости элемента
  mediaQuery?: string
  events?: {
    onBeforeChange?: () => void // Обработчик, вызываемый перед изменением состояния
    onChange?: () => void // Обработчик, вызываемый после изменения состояния
    onTargetTransitionEnd?: (_event: TransitionEvent) => void // Обработчик, вызываемый при завершении перехода
  }
}

/**
 * Класс для создания переключателя состояния на основе добавления и удаления классов у целевого элемента.
 */
export class BuildToggle {
  private config: Config // Конфигурация класса
  public trigger: HTMLElement | null = null
  public target: HTMLElement | null = null
  private observer: MutationObserver | null = null
  private mediaQueryList: MediaQueryList | null = null
  private initialized = false
  /**
   * Конструктор класса BuildToggle.
   *
   * @param {Config} config - Конфигурация, передаваемая при инициализации.
   */
  constructor(config: Config) {
    this.config = config // Сохраняем конфигурацию
    this.initMediaQuery() // Инициализируем компонент
  }

  /**
   * Инициализация компонента. Назначает событие "click" на элемент-триггер.
   * Определяет триггер (строка селектора или HTMLElement) и добавляет ему обработчик клика.
   */
  init() {
    // Определение элемента триггера (по строке селектора или по переданному HTMLElement)
    if (this.config.trigger instanceof HTMLElement) {
      this.trigger = this.config.trigger
    } else if (typeof this.config.trigger === 'string') {
      this.trigger = document.querySelector(
        this.config.trigger
      ) as HTMLElement | null
    }

    if (this.trigger) {
      // Устанавливаем toggleInstance для элемента-триггера
      this.trigger.toggleInstance = this

      this.target = this.resolveTarget(this.trigger)

      // Проверка наличия класса из toggleClasses
      let currentIndex: number = -1

      if (this.target) {
        // Если defaultClass задан, ищем его индекс
        if (this.config.defaultClass) {
          currentIndex = this.config.toggleClasses.indexOf(
            this.config.defaultClass
          )
          if (currentIndex !== -1) {
            this.target.classList.add(this.config.toggleClasses[currentIndex])
            this.target.dataset.tglCurrentClassIndex = currentIndex.toString()
          }
        } else {
          // Если defaultClass не задан, проверяем наличие любого класса из toggleClasses
          this.config.toggleClasses.forEach((toggleClass, index) => {
            if (this.target.classList.contains(toggleClass)) {
              currentIndex = index
            }
          })
          if (currentIndex !== -1) {
            this.target.dataset.tglCurrentClassIndex = currentIndex.toString()
          } else {
            this.target.dataset.tglCurrentClassIndex = '-1'
          }
        }

        // Создаем MutationObserver для отслеживания изменений класса на target
        this.observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === 'attributes' &&
              mutation.attributeName === 'class'
            ) {
              // Проверяем классы и обновляем текущий индекс, если нужно
              let updatedIndex = -1
              this.config.toggleClasses.forEach((toggleClass, index) => {
                if (this.target.classList.contains(toggleClass)) {
                  updatedIndex = index
                }
              })

              if (updatedIndex !== -1) {
                this.target.dataset.tglCurrentClassIndex =
                  updatedIndex.toString()
              }
            }
          })
        })

        // Наблюдаем за изменениями атрибутов на target
        this.observer.observe(this.target, { attributes: true })

        // Генерация атрибутов доступности
        this.generateAria(this.trigger, this.target)

        this.trigger.addEventListener('click', () => {
          this.toggleState()
        })
      }
    }
    this.initialized = true
  }

  /**
   * Обрабатывает mediaQuery: инициализирует или дестроит виджет при изменении состояния.
   */
  private initMediaQuery() {
    if (this.config.mediaQuery) {
      this.mediaQueryList = window.matchMedia(this.config.mediaQuery)
      this.handleMediaQueryChange(this.mediaQueryList.matches)
      this.mediaQueryList.addEventListener('change', (e) => {
        this.handleMediaQueryChange(e.matches)
      })
    } else {
      this.init()
    }
  }

  /**
   * Инициализирует или дестроит компонент в зависимости от соответствия mediaQuery.
   *
   * @param {boolean} matches - Соответствие условиям mediaQuery.
   */
  private handleMediaQueryChange(matches: boolean) {
    if (matches && !this.initialized) {
      this.init()
    } else if (!matches && this.initialized) {
      // eslint-disable-next-line no-console
      console.log('destroying')
      this.destroy()
    }
  }

  /**
   * Определяет целевой элемент для изменения состояния (по строке селектора или по переданному HTMLElement).
   *
   * @param {HTMLElement} el - Элемент, от которого начинается поиск целевого элемента.
   * @return {HTMLElement | null} - Найденный целевой элемент или null.
   */
  private resolveTarget(el: HTMLElement): HTMLElement | null {
    let target = null
    if (typeof this.config.target === 'string') {
      // Проверка на специальные указания: родитель, следующий или предыдущий элемент
      if (
        this.config.target.startsWith('parent') ||
        this.config.target === 'nextEl' ||
        this.config.target === 'prevEl'
      ) {
        target = this.resolveTargetFromString(el, this.config.target) // Находим целевой элемент по строке
      } else {
        target = document.querySelector(
          this.config.target
        ) as HTMLElement | null // Ищем элемент по селектору
      }
    } else if (this.config.target instanceof HTMLElement) {
      target = this.config.target // Прямо возвращаем переданный элемент
    }
    // eslint-disable-next-line no-console
    if (!target) console.warn('BuildToggle: Target element not found')
    return target
  }

  /**
   * Определяет целевой элемент относительно текущего элемента (например, родитель, следующий, предыдущий).
   *
   * @param {HTMLElement} el - Элемент, от которого начинается поиск.
   * @param {string} target - Строка, указывающая, как искать целевой элемент (например, "parent" или "nextEl").
   * @return {HTMLElement | null} - Найденный целевой элемент или null.
   */
  private resolveTargetFromString(
    el: HTMLElement,
    target: string
  ): HTMLElement | null {
    let currentElement: HTMLElement | null = el // Начинаем с текущего элемента
    const actions = target.split('.') // Разбиваем строку на действия

    for (const action of actions) {
      if (action === 'nextEl') {
        currentElement = currentElement?.nextElementSibling as HTMLElement // Ищем следующий элемент
      } else if (action === 'prevEl') {
        currentElement = currentElement?.previousElementSibling as HTMLElement // Ищем предыдущий элемент
      } else if (action === 'parent') {
        currentElement = currentElement?.parentElement as HTMLElement // Ищем родительский элемент
      }
      if (!currentElement) {
        break // Если элемент не найден, прерываем цикл
      }
    }

    return currentElement // Возвращаем найденный элемент
  }

  /**
   * Генерация и установка атрибутов ARIA для обеспечения доступности.
   *
   * @param {HTMLElement} trigger - Элемент триггер, на который назначено событие.
   * @param {HTMLElement} target - Целевой элемент, которому нужно добавить aria-атрибуты.
   */
  private generateAria(trigger: HTMLElement, target: HTMLElement) {
    if (!target) return // Если целевой элемент не найден, выходим
    target.id = generateID() // Уникальный ID для target
    let isExpanded = false // Переменная для отслеживания состояния видимости

    // Связываем триггер с целевым элементом через aria-controls
    if (target && trigger) {
      // Проверяем, виден ли целевой элемент
      if (
        this.config.visibleClasses &&
        this.config.visibleClasses.includes(this.config.defaultClass!)
      ) {
        isExpanded = true // Если класс по умолчанию виден, то устанавливаем isExpanded в true
      }
      trigger.setAttribute('aria-controls', target.id) // Устанавливаем связь между триггером и целевым элементом
      trigger.setAttribute('aria-expanded', isExpanded.toString()) // Устанавливаем состояние видимости
      target.setAttribute('aria-hidden', (!isExpanded).toString()) // Устанавливаем скрытость целевого элемента
    }
  }
  /**
   * Очистка атрибутов ARIA
   *
   * @param {HTMLElement} trigger - Элемент триггер.
   * @param {HTMLElement} target - Целевой элемент.
   */
  private clearAria(trigger: HTMLElement, target: HTMLElement) {
    if (!target || !trigger) return

    trigger.removeAttribute('aria-controls')
    trigger.removeAttribute('aria-expanded')
    target.removeAttribute('aria-hidden')
    target.removeAttribute('id')
    target.removeAttribute('data-tgl-current-class-index')
  }

  /**
   * Переключает состояние целевого элемента, добавляя или удаляя классы из toggleClasses.
   * Также обновляет атрибуты ARIA для обеспечения доступности.
   */
  toggleState() {
    if (!this.target) return // Если целевой элемент не найден, выходим
    // Вызываем событие перед изменением состояния
    if (this.config.events?.onBeforeChange) {
      this.config.events.onBeforeChange() // Обрабатываем событие
    }

    // Получаем или инициализируем текущий индекс класса
    const currentIndex = parseInt(
      this.target.dataset.tglCurrentClassIndex || '0',
      10
    )

    // Удаляем текущий класс
    if (this.config.toggleClasses[currentIndex]) {
      this.target.classList.remove(this.config.toggleClasses[currentIndex]) // Удаляем класс
    }

    // Обновляем индекс для следующего класса
    const nextIndex = (currentIndex + 1) % this.config.toggleClasses.length // Вычисляем индекс следующего класса

    // Добавляем новый класс
    this.target.classList.add(this.config.toggleClasses[nextIndex]) // Добавляем новый класс

    // Сохраняем новый индекс в dataset
    this.target.dataset.tglCurrentClassIndex = nextIndex.toString()

    // Определяем видимость элемента на основе текущего класса и конфигурации visibleClasses
    const isExpanded = this.isElementVisible(nextIndex) // Проверяем видимость

    // Обновляем атрибуты ARIA для обеспечения доступности
    this.trigger.setAttribute('aria-expanded', isExpanded.toString()) // Обновляем состояние триггера
    this.target.setAttribute('aria-hidden', (!isExpanded).toString()) // Обновляем скрытость целевого элемента

    // Вызываем событие после изменения состояния
    if (this.config.events?.onChange) {
      this.config.events.onChange() // Обрабатываем событие
    }

    // Если у целевого элемента есть CSS-переходы, отслеживаем их завершение
    if (this.config.events?.onTargetTransitionEnd) {
      this.target.addEventListener(
        'transitionend',
        (event) => {
          this.config.events?.onTargetTransitionEnd?.(event) // Обрабатываем завершение перехода
        },
        { once: true } // Убедимся, что обработчик сработает только один раз
      )
    }
  }
  /**
   * Переключает состояние на указанный класс из toggleClasses.
   *
   * @param {string} className - Имя класса для переключения.
   */
  toggleToClass(className: string) {
    if (!this.target) return

    // Очищаем все классы и устанавливаем нужный класс
    this.config.toggleClasses.forEach((cls) =>
      this.target.classList.remove(cls)
    )
    this.target.classList.add(className)

    // Обновляем индекс текущего класса
    const newIndex = this.config.toggleClasses.indexOf(className)
    this.target.dataset.tglCurrentClassIndex = newIndex.toString()

    // Обновляем атрибуты ARIA
    const isExpanded = this.isElementVisible(newIndex)
    this.trigger.setAttribute('aria-expanded', isExpanded.toString())
    this.target.setAttribute('aria-hidden', (!isExpanded).toString())

    if (this.config.events?.onChange) {
      this.config.events.onChange()
    }
  }
  /**
   * Определяет, должен ли элемент считаться видимым или скрытым на основе текущего класса
   * и конфигурации visibleClasses.
   *
   * @param {number} index - Индекс текущего класса в массиве toggleClasses.
   * @return {boolean} - Возвращает true, если элемент должен быть видимым, и false, если скрытым.
   */
  private isElementVisible(index: number): boolean {
    // Если конфигурация visibleClasses определена, используем её
    if (this.config.visibleClasses) {
      if (typeof this.config.visibleClasses[0] === 'string') {
        // Проверяем по имени класса
        const currentClass = this.config.toggleClasses[index]
        return this.config.visibleClasses.includes(currentClass) // Возвращаем видимость на основе имени класса
      } else {
        // Проверяем по индексу класса
        return this.config.visibleClasses.includes(index) // Возвращаем видимость на основе индекса класса
      }
    }

    // По умолчанию возвращаем true, если конфигурация видимости не указана
    return index === 0 // Например, первый класс видим по умолчанию
  }

  /**
   * Удаляет все обработчики и наблюдатели, чтобы освободить ресурсы.
   */
  destroy() {
    if (!this.initialized) return // Если не инициализирован, ничего не делаем

    // Удаление обработчиков событий
    if (this.trigger) {
      this.trigger.toggleInstance = null
      this.trigger.removeEventListener('click', this.toggleState.bind(this))
      this.clearAria(this.trigger, this.target) // Удаляем ARIA-атрибуты
    }
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    this.initialized = false
  }
}
