// @ts-nocheck
import { ZodSchema, ZodError } from 'zod'

/**
 * Интерфейс для опций обработчика форм.
 */
interface FormHandlerOptions<T> {
  url?: string // URL для отправки данных на сервер
  onSuccess?: (_data: T, _form: HTMLFormElement) => Promise<void> | void // Колбек при успешной валидации и отправке данных
  onComplete?: (_result: any, _form: HTMLFormElement) => void // Колбек при завершении обработки данных
  onError?: (_error: any, _form: HTMLFormElement) => void // Колбек при возникновении ошибки
  validateOnInput?: boolean // Опция для включения живой валидации
}

/**
 * Класс BuildFormHandler для управления валидацией и отправкой данных форм.
 * Использует паттерн "Strategy" https://refactoring.guru/design-patterns/strategy
 * @template T Тип данных формы.
 */
export class BuildFormHandler<T> {
  private formId: string
  private form: HTMLFormElement
  private schema: ZodSchema<T>
  private options: FormHandlerOptions<T>
  private errors: Record<string, string> = {}
  private formData: Partial<T> = {}

  constructor(
    formId: string,
    schema: ZodSchema<T>,
    options: FormHandlerOptions<T> = {}
  ) {
    this.formId = formId
    this.schema = schema
    this.options = options
    this.form = document.getElementById(this.formId) as HTMLFormElement

    if (this.form) {
      this.init()
    }
  }

  private init(): void {
    this.form.setAttribute('novalidate', '')
    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      this.handleSubmit()
    })
    this.form.addEventListener('reset', () => {
      this.clearErrors()
    })
    const inputs = this.form.querySelectorAll<HTMLInputElement>(
      'input, select, textarea'
    )
    inputs.forEach((input) => {
      input.addEventListener('input', () => {
        if (this.options.validateOnInput) {
          this.validateInput(input)
        }
      })
    })
  }

  /**
   * Обработка отправки формы.
   * Валидация данных и отправка на сервер, если валидация успешна.
   */
  private async handleSubmit(): Promise<void> {
    this.formData = this.getFormData()

    if (!this.validate()) {
      this.displayErrors()
      return
    }

    this.errors = {}
    this.displayErrors()

    if (this.options.onSuccess) {
      await this.options.onSuccess(this.formData as T, this.form)
    }

    if (this.options.url) {
      await this.sendData()
    }
  }

  /**
   * Сбор данных из формы.
   * @return {Partial<T>} Объект с данными формы
   */
  private getFormData(): Partial<T> {
    const data: Partial<T> = {}
    const inputs = this.form.querySelectorAll<HTMLInputElement>(
      'input, select, textarea'
    )
    inputs.forEach((input) => {
      if (input.type === 'checkbox') {
        data[input.name as keyof T] = input.checked as any
      } else if (input.type === 'file') {
        if (input.files) {
          data[input.name as keyof T] = input.multiple
            ? Array.from(input.files)
            : input.files[0]
        }
      } else {
        data[input.name as keyof T] = input.value as any
      }
    })
    return data
  }

  /**
   * Валидация данных формы.
   * @return {boolean} true, если валидация успешна; иначе false.
   */
  private validate(): boolean {
    try {
      this.schema.parse(this.formData)
      this.errors = {}
      return true
    } catch (e) {
      if (e instanceof ZodError) {
        this.errors = e.errors.reduce((acc: Record<string, string>, err) => {
          acc[err.path[0] as string] = err.message
          return acc
        }, {})
        // eslint-disable-next-line no-console
        console.log(this.errors)
      }
      return false
    }
  }

  /**
   * Валидация отдельного поля формы.
   * @param {HTMLInputElement} input HTMLInputElement
   */
  private validateInput(input: HTMLInputElement): void {
    const name = input.name as keyof T
    const value = input.type === 'checkbox' ? input.checked : input.value

    try {
      this.schema.pick({ [name]: true }).parse({ [name]: value })
      delete this.errors[name] // Убираем ошибки для данного поля
    } catch (e) {
      if (e instanceof ZodError) {
        this.errors[name] = e.errors[0].message
      }
    }

    this.displayErrors()
  }

  /**
   * Отображение ошибок в разметке.
   */
  private displayErrors(): void {
    const inputs = this.form.querySelectorAll<HTMLInputElement>(
      'input, select, textarea'
    )

    inputs.forEach((input) => {
      const isCheckbox = input.type === 'checkbox'
      const isSelect = input.tagName.toLowerCase() === 'select'
      // eslint-disable-next-line no-nested-ternary
      const parentClass = isCheckbox
        ? '.btn-checkbox'
        : isSelect
          ? '.main-select-wrapper'
          : '.main-input'

      const parentDiv = input.closest(parentClass)

      if (parentDiv) {
        const fieldName = input.name as keyof T

        if (this.errors[fieldName]) {
          parentDiv.classList.add('has-error')

          if (!isCheckbox) {
            const errorElement = parentDiv.querySelector('.main-input__error')

            if (errorElement) {
              ;(errorElement.querySelector('p') as HTMLElement).innerText =
                this.errors[fieldName]
            } else {
              const newErrorElement = document.createElement('span')
              newErrorElement.className = 'main-input__error'
              newErrorElement.innerHTML = `<p>${this.errors[fieldName]}</p>`
              parentDiv.appendChild(newErrorElement)
            }
          }
        } else {
          parentDiv.classList.remove('has-error')

          if (!isCheckbox) {
            const errorElement = parentDiv.querySelector('.main-input__error')
            if (errorElement) {
              errorElement.remove()
            }
          }
        }
      }
    })
  }

  /**
   * Отправка данных на сервер.
   * TODO: Продумать логику отправки данных разных форматов
   */
  private async sendData(): Promise<void> {
    try {
      const response = await fetch(this.options.url!, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
          // "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(this.formData)
      })
      if (response.status !== 200) {
        throw new Error('Network response was not ok')
      }

      const result = await response.json()
      if (this.options.onComplete) {
        this.options.onComplete(result, this.form)
      }
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error, this.form)
      }
    }
  }

  public clearErrors(): void {
    this.errors = {}
    this.displayErrors()
  }
}
