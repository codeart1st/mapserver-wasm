import MapServer from 'mapserver-wasm'
import { crsDefinitions, layers, WMS_LAYER, WFS_LAYER } from '../config'
import { db } from './offlinecache'

let readFile, clearFile, loadMapConfig,
    dispatchRequestBytes, flushDebugFile, _Module

const logfile = 'error.log'

async function loadCachedGeoPackage(fileName) {
  const key = fileName
  let gpkg = await db.cache.where('name').equals(key).first()

  if (gpkg === undefined) {
    const res = await fetch(fileName)
    const blob = await res.blob()

    await db.cache.add({
      name: key,
      blob
    })
    gpkg = await db.cache.where('name').equals(key).first()
  }
  return gpkg.blob
}

const init = layerName => new Promise((resolve, reject) => {
  MapServer().then(async Module => {
    const layer = layers.find(l => l.name === layerName)
    const gpkg = await loadCachedGeoPackage(layer.fileName)

    const WORKERFS = Module.FS.filesystems['WORKERFS']
    const MEMFS = Module.FS.filesystems['MEMFS']

    Module.FS.mkdir('/ms')
    Module.FS.mkdir('/proj')
    try {
      WORKERFS.node_ops.mknod = MEMFS.node_ops.mknod // GDAL needs temporary file support
      Module.FS.mount(WORKERFS, {
        blobs: [
          { name: layer.fileName, data: gpkg }
        ]
      }, '/ms')
      Module.FS.writeFile('/proj/epsg', crsDefinitions.map(({ crs, definition }) => {
        return `<${crs.replace('EPSG:', '')}>${definition}<>`
      }).join('\n'), { flags: 'w+' })
      initMap(Module, layer)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
})

const initMap = (Module, layer) => {
  readFile = file => Module.FS.readFile(file, { encoding: 'utf8' })
  clearFile = file => Module.FS.writeFile(file, '')
  loadMapConfig = Module.cwrap('loadMapConfig', 'void', ['string'])
  dispatchRequestBytes = Module.cwrap('dispatchRequestBytes', 'number', ['string', 'string'])
  flushDebugFile = Module.cwrap('flushDebugFile', 'void', ['void'])
  _Module = Module
  loadMapConfig(`
    MAP
      DEBUG 5
      CONFIG "MS_ERRORFILE" "${logfile}"
      CONFIG "CPL_LOG" "${logfile}"
      CONFIG "CPL_DEBUG" "ON"
      CONFIG "CPL_LOG_ERRORS" "ON"
      CONFIG "CPL_TIMESTAMP" "ON"
      CONFIG "PROJ_LIB" "/proj/"

      PROJECTION
        "init=${layer.crs.toLowerCase()}"
      END

      WEB
        METADATA
          "wfs_onlineresource" "http://localhost?"
          "wfs_enable_request" "*"
          "wms_onlineresource" "http://localhost?"
          "wms_enable_request" "*"
        END
      END

      ${layer.type === WFS_LAYER ? `
      LAYER
        NAME ${layer.name}
        TYPE ${layer.msType}
        DEBUG 5
        CONNECTIONTYPE OGR
        CONNECTION "/ms/${layer.fileName}"
        DATA "${layer.name}"
        METADATA
          "wfs_use_default_extent_for_getfeature" "OFF"
          "ows_title" "${layer.name}"
          "gml_include_items" "all"
          "gml_featureid" "${layer.idAttributeName}"
          "gml_types" "auto"
        END
      END
      `: ''}

      ${layer.type === WMS_LAYER ? `
      LAYER
        NAME ${layer.name}
        TYPE ${layer.msType}
        DEBUG 5
        DATA "/ms/${layer.fileName}"
        METADATA
          "ows_title" "${layer.name}"
        END
      END
      `: ''}
    END`
  )
}

self.onmessage = async ({ data: { type: msgType, payload: { name, id, data } = {} } }) => {
  switch (msgType) {
    case 'init':
      await init(name)
      self.postMessage('')
      break
    case 'log':
      flushDebugFile()
      console.log(readFile(logfile))
      clearFile(logfile)
      break
    case 'GET':
      console.time(`[${id}] WASM runtime duration in worker`)
      console.log(data)

      const resByteBuffer = dispatchRequestBytes('GET', data)

      const [size, responseData] = new Uint32Array(_Module.HEAP32.buffer, resByteBuffer, 3)
      const response = _Module.HEAP8.buffer.slice(responseData, responseData + size) // copy the data once

      self.postMessage({ id, payload: response }, [response]) // transfer data without copying again

      console.timeEnd(`[${id}] WASM runtime duration in worker`)
      break
  }
}