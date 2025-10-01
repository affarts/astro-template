import Core from '@scripts/modules/Core/Core'

/**
 * Тип для целевого элемента
 */
export type Target = 'nextEl' | 'prevEl' | 'parent' | string | HTMLElement

/**
 * Функция для разрешения целевого элемента на основе переданного значения.
 * @param {HTMLElement} el - Текущий элемент, от которого начинается поиск.
 * @param {Target} target - Целевой элемент, который может быть строкой (селектором или специальной командой) или HTMLElement.
 * @return {HTMLElement | null} - Найденный целевой элемент или null, если не найден.
 */
export function resolveTarget(
  el: HTMLElement,
  target: Target
): HTMLElement | null {
  let targetEl = null
  if (typeof target === 'string') {
    // Проверка на специальные указания: родитель, следующий или предыдущий элемент
    if (
      target.startsWith('parent') ||
      target === 'nextEl' ||
      target === 'prevEl'
    ) {
      targetEl = resolveTargetFromString(el, target) // Находим целевой элемент по строке
    } else {
      targetEl = document.querySelector(target) as HTMLElement | null // Ищем элемент по селектору
    }
  } else if (target instanceof HTMLElement) {
    targetEl = target // Прямо возвращаем переданный элемент
  }
  // eslint-disable-next-line no-console
  if (!target) console.warn('BuildToggle: Target element not found')
  return targetEl
}

/**
 * Разрешает целевой элемент на основе строки с указаниями.
 * Поддерживаются следующие указания:
 * - 'nextEl': следующий соседний элемент
 * - 'prevEl': предыдущий соседний элемент
 * - 'parent': родительский элемент
 * Можно комбинировать указания через точку, например: 'parent.nextEl'
 * @param {HTMLElement} el - Текущий элемент, от которого начинается поиск.
 * @param {string} target - Строка с указаниями для поиска целевого элемента.
 * @return {HTMLElement | null} - Найденный целевой элемент или null, если не найден.
 */
export function resolveTargetFromString(
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
 * Инициализирует Simplebar для элемента.
 * Функция использует менеджер модулей для получения класса Simplebar,
 * поэтому Simplebar должен быть загружен в менеджере модулей до первого вызова initSimplebar.
 * @param {HTMLElement} el - Элемент для инициализации.
 * @param {any} options - Опции для инициализации Simplebar.
 */
export function initSimplebar(el: HTMLElement, options: any) {
  if (el.classList.contains('is-initialized')) {
    return
  }

  const Simplebar = Core.getInstance().moduleManager.getModule('simplebar')
  new Simplebar(el, options)
  el.classList.add('is-initialized')

  const simplebarWrapper = el.querySelector('.simplebar-content-wrapper')
  if (simplebarWrapper) {
    simplebarWrapper.setAttribute('data-scroll-lock-scrollable', '')
  }
}

/**
 * Сбрасывает и удаляет инициализацию Simplebar для элемента.
 * Функция использует менеджер модулей для получения класса Simplebar,
 * поэтому Simplebar должен быть загружен в менеджере модулей до первого вызова resetSimplebar.
 * @param {HTMLElement} element - Элемент для сброса Simplebar.
 */
export function resetSimplebar(element: HTMLElement) {
  if (element?.hasAttribute('data-simplebar')) {
    const Simplebar = Core.getInstance().moduleManager.getModule('simplebar')
    const instance = Simplebar.instances.get(element)

    if (!instance) {
      return
    }

    const content = instance.getContentElement()
    content.querySelectorAll(':scope > *').forEach((innerEl: HTMLElement) => {
      element.append(innerEl)
    })

    instance.unMount()

    element
      .querySelectorAll('[class*="simplebar"]')
      .forEach((node: HTMLElement) => {
        node.remove()
      })

    element.classList.remove(
      'is-initialized',
      'simplebar-scrollable-y',
      'simplebar'
    )
    element.removeAttribute('data-simplebar')
  }
}

/**
 * Инициализирует и сбрасывает Simplebar для элемента на основе медиа-запроса.
 * Функция использует менеджер модулей для получения класса Simplebar,
 * поэтому Simplebar должен быть загружен в менеджере модулей до первого вызова initAdaptiveSimplebar.
 * @param {Object} params - Параметры функции.
 * @param {HTMLElement} params.el - Элемент для инициализации.
 * @param {any} params.options - Опции для инициализации Simplebar.
 * @param {string} params.mediaQuery - Медиа-запрос для активации Simplebar.
 */
export function initAdaptiveSimplebar({ el, options, mediaQuery }): void {
  const mediaQueryList = window.matchMedia(mediaQuery)
  const checkMediaQuery = () => {
    if (mediaQueryList.matches) {
      initSimplebar(el, options)
    } else {
      resetSimplebar(el)
    }
  }

  checkMediaQuery()
  mediaQueryList.addEventListener('change', checkMediaQuery)
}
