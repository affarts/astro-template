import { Modals } from './modules'
import Core from './modules/Core/Core'

const initApp = async () => {
  const core = Core.getInstance()
  await core.init()

  const modals = Modals.getInstance()

  // Init modals
  document.querySelectorAll('[data-modal]').forEach((el: HTMLElement) => {
    modals.addModal(el.dataset.modal, {
      autoShow: el.hasAttribute('data-auto-show'),
      autoShowDelay: parseInt(el.dataset.autoShowDelay, 10) || 0,
      openOver: el.hasAttribute('data-open-over'),
      scrollBar: el.hasAttribute('data-scrollbar')
        ? el.getAttribute('data-scrollbar') === 'true'
        : true
    })
  })
}

document.addEventListener('DOMContentLoaded', initApp)
