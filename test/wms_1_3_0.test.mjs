import { loadMapServer, initMapServer, getDataFromResByteBuffer, printMapServerLog } from './utils'

let mapserver

beforeAll(async () => {
  mapserver = await loadMapServer()

  initMapServer(mapserver, {
    mapFileName: 'wms.map'
  })
})

afterAll(() => {
  //printMapServerLog(mapserver, 'error.log')
})

describe('WMS 1.3.0', () => {
  const globalParams = 'SERVICE=WMS&VERSION=1.3.0'

  test('GetCapabilities request should be valid', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetCapabilities')

    const response = dispatchRequest('GET', searchParams.toString())

    expect(response).toMatchSnapshot()
  })

  test('GetMap request should be return a jpeg image', () => {
    const { cwrap } = mapserver

    const dispatchRequestBytes = cwrap('dispatchRequestBytes', 'number', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetMap')
    searchParams.set('WIDTH', '1000')
    searchParams.set('HEIGHT', '1000')
    searchParams.set('LAYERS', 'testraster')
    searchParams.set('CRS', 'EPSG:3857')
    searchParams.set('BBOX', '-20037508,-20037508,20037508,20037508')
    searchParams.set('FORMAT', 'image/jpeg')

    const resByteBuffer = dispatchRequestBytes('GET', searchParams.toString())
    const body = getDataFromResByteBuffer(mapserver, resByteBuffer)

    expect(body).toMatchFileSnapshot()
  })

  test('GetMap request should be return a png image', () => {
    const { cwrap } = mapserver

    const dispatchRequestBytes = cwrap('dispatchRequestBytes', 'number', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetMap')
    searchParams.set('WIDTH', '1000')
    searchParams.set('HEIGHT', '1000')
    searchParams.set('LAYERS', 'testraster')
    searchParams.set('CRS', 'EPSG:3857')
    searchParams.set('BBOX', '-20037508,-20037508,20037508,20037508')
    searchParams.set('FORMAT', 'image/png')

    const resByteBuffer = dispatchRequestBytes('GET', searchParams.toString())
    const body = getDataFromResByteBuffer(mapserver, resByteBuffer)

    expect(body).toMatchFileSnapshot()
  })

  test('GetMap request should transform to different srs', () => {
    const { cwrap } = mapserver

    const dispatchRequestBytes = cwrap('dispatchRequestBytes', 'number', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetMap')
    searchParams.set('WIDTH', '1000')
    searchParams.set('HEIGHT', '1000')
    searchParams.set('LAYERS', 'testraster')
    searchParams.set('CRS', 'EPSG:4326')
    searchParams.set('BBOX', '-180.0000,-90.0000,180.0000,90.0000')
    searchParams.set('FORMAT', 'image/jpeg')

    const resByteBuffer = dispatchRequestBytes('GET', searchParams.toString())
    const body = getDataFromResByteBuffer(mapserver, resByteBuffer)

    expect(body).toMatchFileSnapshot()
  })

  test('GetMap request should print exception to image output', () => {
    const { cwrap } = mapserver

    const dispatchRequestBytes = cwrap('dispatchRequestBytes', 'number', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetMap')
    searchParams.set('WIDTH', '256')
    searchParams.set('HEIGHT', '256')
    searchParams.set('LAYERS', 'foo')
    searchParams.set('CRS', 'EPSG:4326')
    searchParams.set('BBOX', '-180.0000,-90.0000,180.0000,90.0000')
    searchParams.set('FORMAT', 'image/png')
    searchParams.set('EXCEPTIONS', 'INIMAGE')

    const resByteBuffer = dispatchRequestBytes('GET', searchParams.toString())
    const body = getDataFromResByteBuffer(mapserver, resByteBuffer)

    expect(body).toMatchFileSnapshot()
  })
})