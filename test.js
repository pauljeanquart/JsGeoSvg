import assert from 'node:assert/strict'
import { applyGeoJSONStyle, geoJSONToSVGPath, getGeoJSONBounds } from './geojson-to-svg.js'

const multipolygon = {
  type: 'Feature',
  properties: {
    fill: '#00aaff'
  },
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0]
        ]
      ],
      [
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 2]
        ]
      ]
    ]
  }
}

const bounds = getGeoJSONBounds(multipolygon)
assert.deepEqual(bounds, [0, 0, 3, 3])

const path = geoJSONToSVGPath(multipolygon, { projection: ([x, y]) => [x, y] })
assert.match(path, /M 0 0/)
assert.match(path, /L 3 3/)

const attributes = {}
const styled = applyGeoJSONStyle({ setAttribute(name, value) { attributes[name] = value } }, multipolygon)
assert.equal(attributes.fill, '#00aaff')

console.log('MultiPolygon bounds and fill-color test passed')