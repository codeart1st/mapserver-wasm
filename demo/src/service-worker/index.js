self.oninstall = event => {
  self.skipWaiting() // only for development
  console.log(event)
}

self.onactivate = event => {
  clients.claim()
  console.log(event)
}

const tasks = {}
const postTypeNameRegex = new RegExp(/typeName="([^"]*)"/i)

self.onmessage = ({ data: { id, payload } }) => {
  tasks[id].resolve(payload)
  delete tasks[id]
}

self.onfetch = event => {
  const { request: { method, url } } = event

  if (url.match(/\/(wfs|wms)/)) {
    const id = ('00000' + Math.round(Math.random() * 100000)).slice(-5)
    console.time(`[${id}] WASM runtime duration`)
    event.respondWith((async () => {
      const client = await clients.get(event.clientId)
      let response
      switch (method) {
        case 'GET':
          const search = new URL(url).search
          const searchParams = new URLSearchParams(search)
          const layerName = searchParams.get(url.match(/\/wfs/) ? 'TYPENAMES' : 'LAYERS')
          response = await new Promise((resolve, reject) => {
            tasks[id] = { resolve, reject }
            client.postMessage({ type: 'GET', payload: {
              id,
              name: layerName,
              data: search.substring(1)
            } })
          })
          break
        default:
          return new Response(null, { status: 500 })
      }
      console.timeEnd(`[${id}] WASM runtime duration`)

      const uint8View = new Uint8Array(response)
      const text = new TextDecoder('ascii').decode(uint8View)
      const seperatorIndex = text.indexOf('\r\n\r\n', 0, 'hex')
      const headers = text.substring(0, seperatorIndex)
      const body = uint8View.subarray(seperatorIndex + 4)

      return new Response(body, {
        headers: headers.split('\r\n').map(h => h.split(':'))
      })
    })())
  }
}
