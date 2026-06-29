/**
 * Convert GeoJSON Polygon or MultiPolygon to an SVG path string.
 * Supports an optional projection function to map coordinates to SVG x,y.
 *
 * Usage:
 * import {geoJSONToSVGPath} from './geojson-to-svg.js'
 * const path = geoJSONToSVGPath(geojson, { projection: ([lon,lat]) => [lon, -lat] })
 */

// Use the identity projection when no custom mapping is provided.
function defaultProjection(coord) {
  // Identity projection: assumes coordinates are already in SVG space [x, y]
  return [coord[0], coord[1]]
}

// Normalize GeoJSON geometry into an array of polygon rings.
function ringsFromGeoJSON(geojson) {
  const t = geojson && geojson.type
  if (!geojson || !t) throw new Error('Invalid GeoJSON')

  if (t === 'Feature') {
    return ringsFromGeoJSON(geojson.geometry)
  }

  if (t === 'FeatureCollection') {
    return geojson.features.flatMap((feature) => ringsFromGeoJSON(feature))
  }

  if (t === 'Polygon') return [geojson.coordinates]
  if (t === 'MultiPolygon') return geojson.coordinates

  throw new Error('Only Polygon and MultiPolygon are supported')
}

// Read styling properties from GeoJSON when present.
function getGeoJSONProperties(geojson) {
  if (!geojson) return {}
  if (geojson.properties) return geojson.properties
  if (geojson.type === 'Feature' && geojson.geometry) {
    return getGeoJSONProperties(geojson.geometry)
  }
  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    return geojson.features.reduce((props, feature) => {
      if (feature && feature.properties) {
        return { ...props, ...feature.properties }
      }
      return props
    }, {})
  }
  return {}
}

// Resolve the fill color for a path from GeoJSON properties or explicit options.
function getFillColor(geojson, opts = {}) {
  const props = getGeoJSONProperties(geojson)
  return opts.fill || props.fill || props.fillColor || props.color || opts.defaultFill || '#4da6ff'
}

// Resolve the stroke color for a path from GeoJSON properties or explicit options.
function getStrokeColor(geojson, opts = {}) {
  const props = getGeoJSONProperties(geojson)
  return opts.stroke || props.stroke || props.strokeColor || '#003366'
}

// Apply styling attributes to an SVG path element using GeoJSON properties.
export function applyGeoJSONStyle(target, geojson, opts = {}) {
  if (!target || typeof target.setAttribute !== 'function') return target

  target.setAttribute('fill', getFillColor(geojson, opts))
  target.setAttribute('fill-rule', opts.fillRule || 'evenodd')
  target.setAttribute('stroke', getStrokeColor(geojson, opts))
  target.setAttribute('stroke-width', opts.strokeWidth || '0.5')

  return target
}

// Create an SVG path element and apply styling derived from GeoJSON properties.
export function createSVGPathElement(geojson, opts = {}) {
  if (typeof document === 'undefined') return null

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', geoJSONToSVGPath(geojson, opts))
  return applyGeoJSONStyle(path, geojson, opts)
}

// Compute the bounding box for a Polygon or MultiPolygon by scanning all rings.
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

// Convert GeoJSON geometry into a single SVG path string.
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
