const { loadMapServer, initMapServer, getDocumentFromResponse, printMapServerLog } = require('./utils')

let mapserver

beforeAll(async () => {
  mapserver = await loadMapServer()

  initMapServer(mapserver, {
    mapFileName: 'wfs.map'
  })
})

afterAll(() => {
  //printMapServerLog(mapserver, 'error.log')
})

describe('WFS 1.1.0', () => {
  const globalParams = 'SERVICE=WFS&VERSION=1.1.0'

  test('GetCapabilities request should be valid', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetCapabilities')

    const response = dispatchRequest('GET', searchParams.toString())

    expect(response).toMatchSnapshot()
  })

  test('GetFeature request with unknown feature typename should return a valid ExceptionReport', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'GetFeature')
    searchParams.set('TYPENAMES', 'unknown')

    const response = dispatchRequest('GET', searchParams.toString())

    expect(response).toMatchSnapshot()
  })

  test('DescribeFeatureType request should be valid', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

    searchParams.set('REQUEST', 'DescribeFeatureType')
    searchParams.set('TYPENAMES', 'test')

    const response = dispatchRequest('GET', searchParams.toString())

    expect(response).toMatchSnapshot()
  })

  test('GetFeature request should return a valid feature', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const searchParams = new URLSearchParams(globalParams)

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

  test('GetFeature request with Intersects Filter should return a valid feature', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const body = `<?xml version="1.0" encoding="UTF-8"?>
      <wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" maxFeatures="10" outputFormat="text/xml; subtype=gml/3.1.1" resultType="results" service="WFS" version="1.1.0">
        <Query xmlns="http://www.opengis.net/wfs" xmlns:ms="http://mapserver.gis.umn.edu/mapserver" srsName="EPSG:4326" typeName="ms:test">
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:Intersects xmlns:gml="http://www.opengis.net/gml">
              <ogc:PropertyName>ms:msGeometry</ogc:PropertyName>
              <gml:Envelope srsName="EPSG:4326">
                <gml:lowerCorner>-180.0000 -90.0000</gml:lowerCorner>
                <gml:upperCorner>180.0000 90.0000</gml:upperCorner>
              </gml:Envelope>
            </ogc:Intersects>
          </ogc:Filter>
        </Query>
      </wfs:GetFeature>
    `

    const response = dispatchRequest('POST', body)

    const document = getDocumentFromResponse(response)

    const result = document.evaluate('//ms:test', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    expect(result.snapshotLength).toBe(1)

    const node = result.snapshotItem(0)
    expect(node.getAttribute("gml:id")).toBe('test.1')
  })

  test('GetFeature request with Intersects Filter should return a valid feature with different srs', () => {
    const { cwrap } = mapserver

    const dispatchRequest = cwrap('dispatchRequest', 'string', ['string', 'string'])
    const body = `<?xml version="1.0" encoding="UTF-8"?>
      <wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" maxFeatures="10" outputFormat="text/xml; subtype=gml/3.1.1" resultType="results" service="WFS" version="1.1.0">
        <Query xmlns="http://www.opengis.net/wfs" xmlns:ms="http://mapserver.gis.umn.edu/mapserver" srsName="EPSG:3857" typeName="ms:test">
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:Intersects xmlns:gml="http://www.opengis.net/gml">
              <ogc:PropertyName>ms:msGeometry</ogc:PropertyName>
              <gml:Envelope srsName="EPSG:3857">
                <gml:lowerCorner>-20037508 -20037508</gml:lowerCorner>
                <gml:upperCorner>20037508 20037508</gml:upperCorner>
              </gml:Envelope>
            </ogc:Intersects>
          </ogc:Filter>
        </Query>
      </wfs:GetFeature>
    `

    const response = dispatchRequest('POST', body)

    const document = getDocumentFromResponse(response)

    const result = document.evaluate('//ms:test', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    expect(result.snapshotLength).toBe(1)

    const node = result.snapshotItem(0)
    expect(node.getAttribute("gml:id")).toBe('test.1')

    const result2 = document.evaluate('//gml:pos', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    expect(result2.snapshotLength).toBe(1)

    const node2 = result2.snapshotItem(0)
    expect(node2.textContent).toBe('222638.981587 6274861.394007')
  })
})