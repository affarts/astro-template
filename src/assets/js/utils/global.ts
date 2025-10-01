/**
 * Дебаунс функция
 * @param {Function} func - Функция, которую нужно дебаунсить
 * @param {number} [wait=50] - Время ожидания перед вызовом функции
 * @param {boolean} [immediate=false] - Если true, функция будет вызвана немедленно
 * @return {Function} Дебаунс функция
 */
// eslint-disable-next-line space-before-function-paren
export function debounce<T extends (..._args: any[]) => void>(
  func: T,
  wait = 50,
  immediate = false
): () => void {
  let timeout: any
  return function (this: any, ...args: any[]): void {
    const context = self
    const later = () => {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) {
      func.apply(context, args)
    }
  }
}

/**
 * Конвертирует строку из camelCase в kebab-case.
 * @param {string} str - Входная строка в camelCase.
 * @return {string} - Выходная строка в kebab-case.
 */
export function kebabCase(str: string) {
  const result = str.replace(
    /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
    (match) => '-' + match.toLowerCase()
  )
  return str[0] === str[0].toUpperCase() ? result.substring(1) : result
}
