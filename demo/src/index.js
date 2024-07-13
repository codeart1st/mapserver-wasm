import { initMap } from './map'
import { layers } from './config'

initMap()

const worker = {}

const initWorker = layer => new Promise(resolve => {
  const worker = new Worker('/web-worker.js')
  worker.onmessage = () => resolve(worker)
  worker.postMessage({ type: 'init', payload: { ...layer } })
})

const register = async () => {
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js')
    console.log('Registrierung erfolgreich. Scope ist ' + registration.scope)

    for (let layer of layers) {
      worker[layer.name] = initWorker(layer)
      worker[layer.name].then(worker => {
        worker.onmessage = ({ data }) => {
          registration.active.postMessage(data)
        }
        return worker
      })
    }

    navigator.serviceWorker.onmessage = async ({ data }) => {
      const w = await worker[data.payload.name] || await worker[Object.keys(worker)[0]]
      w.postMessage(data)
    }
  } catch (error) {
    console.error('Registrierung fehlgeschlagen mit ' + error);
  }
}

window.log = () => {
  Object.values(worker).forEach(async w => (await w).postMessage({ type: 'log' }))
}

register()
