type ActionParams = {
  fetchManager: FetchManager
  endpoint: string
  method: 'GET' | 'POST'
  data?: Record<string, any>
  element: HTMLElement
  options?: Record<string, any>
}

type ActionHandler = (_params: ActionParams) => Promise<void>

class FormDataCollector {
  static collect(
    forms: HTMLFormElement | NodeListOf<HTMLFormElement>,
    extraData: Record<string, any> = {}
  ): Record<string, any> {
    const formElements = forms instanceof NodeList ? Array.from(forms) : [forms]
    const data: Record<string, any> = {}

    formElements.forEach((form) => {
      const formData = new FormData(form)
      formData.forEach((value, key) => {
        if (data[key]) {
          data[key] = Array.isArray(data[key])
            ? [...data[key], value as string]
            : [data[key], value as string]
        } else {
          data[key] = value
        }
      })
    })

    Object.entries(extraData).forEach(([key, value]) => {
      data[key] = value
    })
    return data
  }

  static toQueryString(data: any): string {
    return new URLSearchParams(
      Object.entries(data).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
          // Добавляем только непустые значения массивов
          value.forEach((item) => {
            if (item && item !== null && item !== '') {
              acc.append(key, String(item))
            }
          })
        } else if (value && value !== null && value !== '') {
          // Добавляем только ключи с непустыми значениями
          acc.append(key, String(value))
        }
        return acc
      }, new URLSearchParams())
    ).toString()
  }
}

class DOMUpdater {
  static updateCasesFilter(
    response: any,
    element: HTMLElement,
    options: { replace?: boolean } = {}
  ) {
    const paginateButtons = document.querySelectorAll(
      `button[data-fetch=${element.getAttribute('data-fetch')}]`
    ) as NodeListOf<HTMLButtonElement>
    const container = document.querySelector('#caseStream')
    if (container) {
      if (options.replace) {
        container.innerHTML = response.data.content
      } else {
        container.insertAdjacentHTML('beforeend', response.data.content)
      }
    }
    paginateButtons.forEach((button: HTMLButtonElement) => {
      const currentPage = parseInt(
        button.getAttribute('data-next-page') || '1',
        10
      )
      if (response.data.has_next) {
        button.setAttribute('data-next-page', (currentPage + 1).toString())
      } else {
        button.setAttribute('disabled', 'true')
      }
    })
  }
  static updateBlogFilter(
    response: any,
    element: HTMLElement,
    options: { replace?: boolean } = {}
  ) {
    const paginateButtons = document.querySelectorAll<HTMLButtonElement>(
      `button[data-fetch="${element.getAttribute('data-fetch')}"]`
    )
    const container = document.querySelector('#articleStream')

    if (!container) return

    const updateContent = (content: string, replace: boolean) => {
      if (replace) {
        container.innerHTML = content
      } else {
        container.insertAdjacentHTML('beforeend', content)
      }
    }

    const updatePaginateButtons = (hasNext: boolean, replace: boolean) => {
      paginateButtons.forEach((button) => {
        if (hasNext) {
          const currentPage = parseInt(
            button.getAttribute('data-next-page') || '1',
            10
          )
          // eslint-disable-next-line no-unused-expressions
          !replace
            ? button.setAttribute(
                'data-next-page',
                (currentPage + 1).toString()
              )
            : button.setAttribute('data-next-page', '2')
          button.removeAttribute('disabled')
        } else {
          button.setAttribute('disabled', 'true')
        }
        button.classList.remove('is-loading')
      })
    }

    updateContent(response.data.content, options.replace || false)
    updatePaginateButtons(response.data.has_next, options.replace || false)
  }
  static updateLike(response: any, element: HTMLElement) {
    const buttons = document.querySelectorAll(
      `button[data-fetch=${element.getAttribute('data-fetch')}]`
    )
    buttons.forEach((_) => _.classList.remove('is-active'))
    element.classList.add('is-active')
  }
}

class ActionDispatcher {
  private actions: Map<string, ActionHandler>

  constructor() {
    this.actions = new Map()
  }

  registerAction(actionName: string, handler: ActionHandler) {
    this.actions.set(actionName, handler)
  }

  async dispatch(actionName: string, params: ActionParams) {
    const handler = this.actions.get(actionName)
    if (!handler) {
      throw new Error(`Action "${actionName}" not found`)
    }
    return handler(params)
  }
}

class FetchManager {
  private baseUrl: string
  private headers: Record<string, string>
  private plugins: FetchPlugin[]

  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.headers = headers
    this.plugins = []
  }

  use(plugin: FetchPlugin) {
    this.plugins.push(plugin)
  }

  async request(endpoint: string, options: RequestInit): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      ...options,
      headers: { ...this.headers, ...options.headers }
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`)

      const json = await response.json()

      for (const plugin of this.plugins) {
        if (plugin.afterRequest) {
          plugin.afterRequest(response)
        }
      }

      return json
    } catch (error) {
      for (const plugin of this.plugins) {
        if (plugin.onError) {
          plugin.onError(error)
        }
      }
      throw error
    }
  }
}

interface FetchPlugin {
  afterRequest?(_response: Response): void
  onError?(_error: Error): void
}

const fetchManager = new FetchManager(
  import.meta.env.PROD ? `${window.origin}` : 'http://localhost:8000',
  {
    'Content-Type': 'application/json'
  }
)
const dispatcher = new ActionDispatcher()

dispatcher.registerAction(
  'caseFilterAction',
  async ({ fetchManager: fm, endpoint, element }) => {
    const response = await fm.request(endpoint, { method: 'GET' })
    DOMUpdater.updateCasesFilter(response, element)
  }
)

dispatcher.registerAction(
  'blogFilterAction',
  async ({ fetchManager: fm, endpoint, element, options }) => {
    const response = await fm.request(endpoint, { method: 'GET' })
    DOMUpdater.updateBlogFilter(response, element, { ...options })
  }
)

dispatcher.registerAction(
  'articleLikeAction',
  async ({ fetchManager: fm, endpoint, data, element }) => {
    const response = await fm.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    DOMUpdater.updateLike(response, element)
  }
)

const caseFetchTriggers = document.querySelectorAll(
  '[data-fetch="caseFilterAction"]'
)
caseFetchTriggers.forEach((element: HTMLElement) => {
  const action = element.getAttribute('data-fetch')
  if (element.tagName === 'FORM') {
    element.addEventListener('change', (e) => {
      e.preventDefault()
      const forms = document.querySelectorAll(
        `form[data-fetch=${action}]`
      ) as NodeListOf<HTMLFormElement>
      const data = FormDataCollector.collect(forms)
      dispatcher.dispatch(action, {
        fetchManager,
        endpoint: '/api/cases/?' + FormDataCollector.toQueryString(data),
        method: 'GET',
        data,
        element,
        options: { replace: true }
      })
    })
  } else if (element.tagName === 'BUTTON') {
    element.addEventListener('click', () => {
      const forms = document.querySelectorAll(
        `form[data-fetch=${action}]`
      ) as NodeListOf<HTMLFormElement>
      const data = FormDataCollector.collect(forms, {
        page: element.getAttribute('data-next-page') || 1
      })
      dispatcher.dispatch(action, {
        fetchManager,
        endpoint: '/api/cases/?' + FormDataCollector.toQueryString(data),
        method: 'GET',
        data,
        element,
        options: { replace: false }
      })
    })
  }
})

const blogFetchTriggers = document.querySelectorAll(
  '[data-fetch="blogFilterAction"]'
)
blogFetchTriggers.forEach((element: HTMLElement) => {
  const action = element.getAttribute('data-fetch')
  if (element.tagName === 'FORM') {
    element.addEventListener('submit', (e) => {
      e.preventDefault()
      const forms = document.querySelectorAll(
        `form[data-fetch=${action}]`
      ) as NodeListOf<HTMLFormElement>
      const data = FormDataCollector.collect(forms, { page: 1 })
      dispatcher.dispatch(action, {
        fetchManager,
        endpoint: '/api/blog/?' + FormDataCollector.toQueryString(data),
        method: 'GET',
        data,
        element,
        options: { replace: true }
      })
    })
    element.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement | HTMLSelectElement
      if (
        target.type === 'checkbox' ||
        target.type === 'radio' ||
        target.tagName === 'SELECT'
      ) {
        e.preventDefault()
        const forms = document.querySelectorAll(
          `form[data-fetch=${action}]`
        ) as NodeListOf<HTMLFormElement>
        const data = FormDataCollector.collect(forms, { page: 1 })
        dispatcher.dispatch(action, {
          fetchManager,
          endpoint: '/api/blog/?' + FormDataCollector.toQueryString(data),
          method: 'GET',
          data,
          element,
          options: { replace: true }
        })
      }
    })
  } else if (element.tagName === 'BUTTON') {
    element.addEventListener('click', () => {
      element.classList.add('is-loading')
      const forms = document.querySelectorAll(
        `form[data-fetch=${action}]`
      ) as NodeListOf<HTMLFormElement>
      const data = FormDataCollector.collect(forms, {
        page: element.getAttribute('data-next-page') || 1
      })
      dispatcher.dispatch(action, {
        fetchManager,
        endpoint: '/api/blog/?' + FormDataCollector.toQueryString(data),
        method: 'GET',
        data,
        element,
        options: { replace: false }
      })
    })
  }
})

const articleLikeFetchTriggers = document.querySelectorAll(
  '[data-fetch="articleLikeAction"]'
)
articleLikeFetchTriggers.forEach((element: HTMLElement) => {
  const action = element.getAttribute('data-fetch')
  const attrData = JSON.parse(element.getAttribute('data-fetch-data'))
  const data = { action: attrData.like }
  element.addEventListener('click', () => {
    dispatcher.dispatch(action, {
      fetchManager,
      endpoint: `/api/blog/like/${attrData.id}/`,
      method: 'GET',
      data,
      element
    })
  })
})
