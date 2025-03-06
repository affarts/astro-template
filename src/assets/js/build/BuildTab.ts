import Core from '../Core'

// Model: Управление состоянием вкладок
class TabsModel {
  private activeIndex: number

  constructor(initialIndex = 0) {
    this.activeIndex = initialIndex
  }

  public getActiveIndex() {
    return this.activeIndex
  }

  public setActiveIndex(index: number) {
    this.activeIndex = index
  }
}

class TabsView {
  public core: Core
  private tabButtonsContainer: HTMLElement
  private tabButtons: HTMLElement[]
  private tabsContent: HTMLElement | null
  private tabsContentChildren: HTMLElement[]
  private highlight: HTMLElement

  constructor(tabButtonsContainer: HTMLElement) {
    this.tabButtonsContainer = tabButtonsContainer
    this.tabButtons = Array.from(
      tabButtonsContainer.querySelectorAll('.tab-btn__input')
    ) as HTMLElement[]
    this.tabsContent = tabButtonsContainer.nextElementSibling?.querySelector(
      '.tabs-content'
    ) as HTMLElement | null
    this.tabsContentChildren = this.tabsContent
      ? (Array.from(this.tabsContent.children) as HTMLElement[])
      : []
    this.highlight = this.tabButtonsContainer.querySelector(
      '.tabs-highlight'
    ) as HTMLElement
    this.core = Core.getInstance()
  }

  public getTabButtons(): HTMLElement[] {
    return this.tabButtons
  }

  public getTabsContentChildren(): HTMLElement[] {
    return this.tabsContentChildren
  }

  public updateHighlight(button: HTMLElement) {
    const tabRect = button.closest('.tab-btn').getBoundingClientRect()
    const tabsRect = this.tabButtonsContainer.getBoundingClientRect()
    const scrollLeft = this.tabButtonsContainer.scrollLeft

    this.highlight.style.width = `${tabRect.width}px`
    this.highlight.style.left = `${tabRect.left - tabsRect.left + scrollLeft}px`

    this.highlight.style.animation = 'none'
    void this.highlight.offsetWidth
    this.highlight.style.animation = 'speed-deform 0.5s forwards'
  }

  public updateHeight(newContent: HTMLElement | null) {
    if (!this.tabsContent || !newContent) return

    this.core.moduleManager.getModule('gsap').to(this.tabsContent, {
      height: newContent.scrollHeight,
      duration: 0.1,
      ease: 'none'
    })
  }

  public animateContentSwitch(
    prevContent: HTMLElement | null,
    newContent: HTMLElement | null,
    direction: 'left' | 'right',
    newIndex: number
  ) {
    if (!this.tabsContent) return

    this.core.moduleManager.getModule('gsap').to(this.tabsContent, {
      x: `-${newIndex * 100}%`,
      duration: 0.5,
      ease: 'customEase'
    })

    if (prevContent) {
      this.core.moduleManager.getModule('gsap').to(prevContent, {
        scaleX: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: 'customEase',
        rotate: direction === 'left' ? 15 : -15
      })
    }

    if (newContent) {
      this.core.moduleManager.getModule('gsap').fromTo(
        newContent,
        {
          scaleX: 0.6,
          opacity: 0,
          x: direction === 'left' ? 100 : -100,
          rotate: direction === 'left' ? 15 : -15
        },
        { scaleX: 1, opacity: 1, x: 0, duration: 0.5, rotate: 0 }
      )
    }
  }
}

class TabsController {
  private model: TabsModel
  private view: TabsView
  private prevButton: HTMLElement | null

  constructor(tabButtonsContainer: HTMLElement) {
    this.model = new TabsModel()
    this.view = new TabsView(tabButtonsContainer)
    this.prevButton =
      this.view
        .getTabButtons()
        .find((btn) => btn.matches('.tab-btn__input:checked')) || null
    this.init()
  }

  public init() {
    this.setupInitialState()
    this.setupEventListeners()
    this.observeResize()
  }

  private setupInitialState() {
    const initialIndex = this.view.getTabButtons().indexOf(this.prevButton)
    this.model.setActiveIndex(initialIndex >= 0 ? initialIndex : 0)

    this.view.getTabsContentChildren().forEach((content, index) => {
      if (index !== this.model.getActiveIndex()) {
        this.view.core.moduleManager
          .getModule('gsap')
          .set(content, { opacity: 0 })
      }
    })

    this.view.updateHighlight(
      this.view.getTabButtons()[this.model.getActiveIndex()]
    )
  }

  private switchTab(button: HTMLElement) {
    const prevIndex = this.model.getActiveIndex()
    const newIndex = this.view.getTabButtons().indexOf(button)

    if (newIndex === prevIndex) return

    const direction = newIndex > prevIndex ? 'left' : 'right'
    const prevContent = this.view.getTabsContentChildren()[prevIndex] || null
    const newContent = this.view.getTabsContentChildren()[newIndex] || null

    this.view.updateHeight(newContent)
    this.view.animateContentSwitch(prevContent, newContent, direction, newIndex)

    this.model.setActiveIndex(newIndex)
    this.prevButton = button
  }

  private setupEventListeners() {
    this.view.getTabButtons().forEach((button) => {
      button.addEventListener('change', () => {
        this.switchTab(button)
        this.view.updateHighlight(button)
      })
    })
  }

  private observeResize() {
    if (!this.view.getTabsContentChildren().length) return

    const ro = new ResizeObserver(() => {
      const newIndex = this.model.getActiveIndex()
      const activeContent = this.view.getTabsContentChildren()[newIndex] || null
      this.view.updateHeight(activeContent)
    })

    this.view.getTabsContentChildren().forEach((content) => ro.observe(content))
  }
}

export class BuildTab {
  private tabContainers: HTMLElement[]
  private core: Core
  constructor() {
    this.tabContainers = Array.from(
      document.querySelectorAll('.tabs')
    ) as HTMLElement[]
    this.core = Core.getInstance()
    this.init()
  }

  public init() {
    const modulePromises = this.core.moduleManager.loadModule('gsap')
    const loadedModules = Promise.all([modulePromises])

    loadedModules.then(() => {
      this.tabContainers.forEach((container) => {
        new TabsController(container)
      })
    })
  }
}
