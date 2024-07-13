export const crsDefinitions = [
  { crs: 'EPSG:3067', definition: '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' },
  { crs: 'EPSG:3857', definition: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +wktext +no_defs' }
]

export const WFS_LAYER = 0
export const WMS_LAYER = 1

export const layers = [
  {
    type: WMS_LAYER,
    msType: 'RASTER',
    fileName: 'testraster.gpkg',
    name: 'testraster',
    crs: 'EPSG:3857'
  },
  {
    type: WFS_LAYER,
    msType: 'LINE',
    fileName: 'lines.gpkg',
    name: 'lines',
    idAttributeName: 'id',
    crs: 'EPSG:3067'
  }
]