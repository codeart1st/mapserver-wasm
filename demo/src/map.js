import Map from 'ol/Map'
import View from 'ol/View'
import { WFS } from 'ol/format'
import { Vector as VectorLayer } from 'ol/layer'
import VectorSource from 'ol/source/Vector'
import TileWMS from 'ol/source/TileWMS'
import TileGrid from 'ol/tilegrid/TileGrid'
import OSM from 'ol/source/OSM'
import { transformExtent } from 'ol/proj'
import { bbox } from 'ol/loadingstrategy'
import TileLayer from 'ol/layer/Tile'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

import { crsDefinitions, layers, WFS_LAYER, WMS_LAYER } from './config'

import 'ol/ol.css'

proj4.defs(crsDefinitions.map(({ crs, definition }) => [crs, definition]))
register(proj4)

const defaultCRS = 'EPSG:3857'
const osmSource = new OSM()

const createWfsLayer = ({ name, crs }) => {
  const source = new VectorSource({
    format: new WFS(),
    loader: async extent => {
      const bbox = transformExtent(extent, defaultCRS, crs).join(',')
      const searchParams = new URLSearchParams()

      searchParams.set('SERVICE', 'WFS')
      searchParams.set('VERSION', '1.1.0')
      searchParams.set('REQUEST', 'GetFeature')
      searchParams.set('TYPENAMES', name)
      searchParams.set('BBOX', bbox + ',' + crs)

      const url = '/wfs?' + searchParams.toString()
      const resp = await fetch(url)
      const responseText = await resp.text()
      const features = source.getFormat().readFeatures(responseText, {
        dataProjection: crs,
        featureProjection: defaultCRS
      })
      source.addFeatures(features)
    },
    strategy: bbox
  })

  return new VectorLayer({
    source,
    maxResolution: 15
  })
}

const createWmsLayer = ({ name, crs }) => new TileLayer({
  source: new TileWMS({
    url: '/wms',
    params: {
      VERSION: '1.3.0',
      LAYERS: name,
      CRS: crs
    },
    tileGrid: new TileGrid({
      tileSize: [512, 512],
      resolutions: osmSource.getResolutions(),
      extent: [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892]
    })
  })
})

export const initMap = () => {
  new Map({
    layers: [
      new TileLayer({
        source: osmSource
      }),
      ...layers.map(layer => {
        if (layer.type === WFS_LAYER) {
          return createWfsLayer(layer)
        }
        if (layer.type === WMS_LAYER) {
          return createWmsLayer(layer)
        }
      })
    ],
    target: 'map',
    view: new View({
      center: [3028129.312546, 9632288.556385],
      zoom: 14,
      enableRotation: false
    })
  })
}