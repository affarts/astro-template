import Core from './Core'

const initApp = async () => {
  const core = Core.getInstance()
  await core.init()
}

document.addEventListener('DOMContentLoaded', initApp)
