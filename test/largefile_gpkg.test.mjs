import { loadMapServer, initMapServer, getDocumentFromResponse, createLargeFileSqliteDbFromExisting, printMapServerLog } from './utils'
import fs from 'fs'

const basePath = './test/assets/'

let mapserver, filename

beforeAll(async () => {
  filename = await createLargeFileSqliteDbFromExisting(basePath + 'test.gpkg')
  mapserver = await loadMapServer()

  initMapServer(mapserver, {
    mapFileName: 'wfs_largefile.map'
  })
})

afterAll(() => {
  fs.rmSync(basePath + filename)
  //printMapServerLog(mapserver, 'error.log')
})

test('GetFeature request should return a valid feature for large files greater than 2 GiB', () => {
  const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams()

    searchParams.set('SERVICE', 'WFS')
    searchParams.set('VERSION', '1.1.0')
    searchParams.set('REQUEST', 'GetFeature')
    searchParams.set('TYPENAMES', 'test')
    searchParams.set('MAXFEATURES', '1')

    const response = dispatchRequest('GET', searchParams.toString())

    const document = getDocumentFromResponse(response)

    const result = document.evaluate('//ms:test', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    expect(result.snapshotLength).toBe(1)

    const node = result.snapshotItem(0)
    expect(node.getAttribute("gml:id")).toBe('test.1')
})