import assert from 'node:assert/strict'
import { geoJSONToSVGPath, getGeoJSONBounds } from './geojson-to-svg.js'

const multipolygon = {
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

const bounds = getGeoJSONBounds(multipolygon)
assert.deepEqual(bounds, [0, 0, 3, 3])

const path = geoJSONToSVGPath(multipolygon, { projection: ([x, y]) => [x, y] })
assert.match(path, /M 0 0/)
assert.match(path, /L 3 3/)

console.log('MultiPolygon bounds test passed')