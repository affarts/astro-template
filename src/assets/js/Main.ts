import Core from './modules/Core/Core'

const initApp = async () => {
  const core = Core.getInstance()
  await core.init()
}

document.addEventListener('DOMContentLoaded', initApp)
