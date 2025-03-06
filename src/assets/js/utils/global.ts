export function debounce<T extends(..._args: any[]) => void>(
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
export function generateID(): string {
  return Math.random().toString(36).substring(2, 10)
}
export function chunkArray(array, size) {
  const result = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

export function isEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function kebabCase(str: string) {
  const result = str.replace(
    /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
    (match) => '-' + match.toLowerCase()
  )
  return str[0] === str[0].toUpperCase() ? result.substring(1) : result
}
