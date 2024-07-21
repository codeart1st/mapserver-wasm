import createFetchMock from 'vitest-fetch-mock'
import { readFileSync, copyFileSync, statSync } from 'fs'
import { dirname, join } from 'path'
import sqlite3 from 'sqlite3'
import { vi } from 'vitest'

const fetchMocker = createFetchMock(vi)
fetchMocker.enableMocks()

const CHUNK_SIZE = 25 * 1024 * 1024 // 25 MiB

self.fs = require('fs') // bring into scope for emscripten NODEFS

const loadMapServer = async () => {
  vi.spyOn(global.console, 'warn').mockImplementation()

  fetch.mockResponse(async req => {
    if (!req.url.endsWith('mapserver-node.wasm')) {
      return { status: 404, body: 'Not Found' }
    }
    return { status: 200, body: readFileSync('./dist/mapserver.wasm') }
  })

  return await import('../dist/mapserver-node.js')()
}

const initMapServer = ({ FS, cwrap }, { mapFileName }) => {
  const NODEFS = FS.filesystems['NODEFS']

  FS.mkdir('/ms')
  FS.mkdir('/proj')

  FS.mount(NODEFS, { root: './test/assets' }, '/ms')
  FS.mount(NODEFS, { root: './test/assets' }, '/proj')

  const loadMapConfig = cwrap('loadMapConfig', 'void', ['string'])

  loadMapConfig(readFileSync('./test/assets/' + mapFileName, { encoding: 'utf8' }))
}

const getDocumentFromResponse = response => {
  const seperatorIndex = response.indexOf('\n\r\n')
  const headers = response.substring(0, seperatorIndex).split('\n\r')
  const body = response.substring(seperatorIndex + 3)

  const parser = new DOMParser()
  return parser.parseFromString(body, 'text/xml')
}

const getDataFromResByteBuffer = (mapserver, resByteBuffer) => {
  const [size, data] = new Uint32Array(mapserver.HEAP32.buffer, resByteBuffer, 3)
  const response = Buffer.from(new Uint8Array(mapserver.HEAP8.buffer, data, size))

  const seperatorIndex = response.indexOf('0d0a0d0a', 0, 'hex')
  const headers = response.subarray(0, seperatorIndex).toString('utf8')
  const body = response.subarray(seperatorIndex + 4)

  return body
}

const createLargeFileSqliteDbFromExisting = async existing => {
  const filename = 'garbage.gpkg'
  const garbage = Buffer.allocUnsafe(CHUNK_SIZE)
  const filePath = join(dirname(existing), filename)

  copyFileSync(existing, filePath)

  const db = new sqlite3.Database(filePath)
  await new Promise(resolve =>
    db.run('ALTER TABLE gpkg_contents ADD garbage BLOB', resolve)
  )

  for (let i = 0; i < 85; i++) { // round about 2 GiB of chunks
    await new Promise(resolve =>
      db.run("INSERT INTO gpkg_contents (table_name, data_type, identifier, last_change, garbage) VALUES (?, 'attributes', ?, CURRENT_TIMESTAMP, ?)", 'id_' + i, 'id_' + i, garbage, resolve)
    )
  }

  await new Promise((resolve, reject) => {
    db.close(err => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })

  const stats = statSync(filePath)
  expect(stats.size).toBeGreaterThan(2 * 1024 * 1024 * 1024) // 2 GiB

  return filename
}

const printMapServerLog = ({ FS, cwrap }, logfile) => {
  const flushDebugFile = cwrap('flushDebugFile', 'void', ['void'])
  const readFile = file => FS.readFile(file, { encoding: 'utf8' })
  const clearFile = file => FS.writeFile(file, '')

  flushDebugFile()
  console.log(readFile(logfile))
  clearFile(logfile)
}

module.exports = {
  loadMapServer,
  initMapServer,
  getDocumentFromResponse,
  getDataFromResByteBuffer,
  createLargeFileSqliteDbFromExisting,
  printMapServerLog
}