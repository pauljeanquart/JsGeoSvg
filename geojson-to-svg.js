/**
 * Convert GeoJSON Polygon or MultiPolygon to an SVG path string.
 * Supports an optional projection function to map coordinates to SVG x,y.
 *
 * Usage:
 * import {geoJSONToSVGPath} from './geojson-to-svg.js'
 * const path = geoJSONToSVGPath(geojson, { projection: ([lon,lat]) => [lon, -lat] })
 */

function defaultProjection(coord) {
  // Identity projection: assumes coordinates are already in SVG space [x, y]
  return [coord[0], coord[1]]
}

function ringsFromGeoJSON(geojson) {
  const t = geojson && geojson.type
  if (!geojson || !t) throw new Error('Invalid GeoJSON')

  if (t === 'Polygon') return [geojson.coordinates]
  if (t === 'MultiPolygon') return geojson.coordinates

  throw new Error('Only Polygon and MultiPolygon are supported')
}

export function getGeoJSONBounds(geojson) {
  const ringsList = ringsFromGeoJSON(geojson)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const polygon of ringsList) {
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length === 0) continue

      for (const [x, y] of ring) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  return [minX, minY, maxX, maxY]
}

export function geoJSONToSVGPath(geojson, opts = {}) {
  const projection = opts.projection || defaultProjection
  const ringsList = ringsFromGeoJSON(geojson)

  const parts = []

  for (const polygon of ringsList) {
    // polygon is an array of rings; first is exterior, others are holes
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length === 0) continue

      let seg = ''
      for (let i = 0; i < ring.length; i++) {
        const coord = ring[i]
        const [x, y] = projection(coord)
        const vx = +x // coerce to Number
        const vy = +y
        if (i === 0) seg += `M ${vx} ${vy}`
        else seg += ` L ${vx} ${vy}`
      }
      seg += ' Z'
      parts.push(seg)
    }
  }

  return parts.join(' ')
}

export default geoJSONToSVGPath
