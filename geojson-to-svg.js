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

  if (t === 'GeometryCollection') {
    return geojson.geometries.flatMap((geometry) => ringsFromGeoJSON(geometry))
  }

  if (t === 'Polygon') return [geojson.coordinates]
  if (t === 'MultiPolygon') return geojson.coordinates

  return []
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
  return opts.fill || props.fill || props.fillColor || props['marker-color'] || props.color || opts.defaultFill || '#4da6ff'
}

// Resolve the stroke color for a path from GeoJSON properties or explicit options.
function getStrokeColor(geojson, opts = {}) {
  const props = getGeoJSONProperties(geojson)
  return opts.stroke || props.stroke || props.strokeColor || props['marker-color'] || '#003366'
}

// Resolve the marker color for point features so circles use the intended fill color.
function getMarkerColor(geojson, opts = {}) {
  const props = getGeoJSONProperties(geojson)
  return opts.markerColor || props['marker-color'] || props.fill || props.fillColor || props.color || '#ff0000'
}

// Apply styling attributes to an SVG path element using GeoJSON properties.
export function applyGeoJSONStyle(target, geojson, opts = {}) {
  if (!target || typeof target.setAttribute !== 'function') return target

  target.setAttribute('fill', getFillColor(geojson, opts))
  target.setAttribute('fill-rule', opts.fillRule || 'evenodd')
  target.setAttribute('stroke', getStrokeColor(geojson, opts))
  target.setAttribute('stroke-width', opts.strokeWidth || '1')

  return target
}

// Create SVG elements for the GeoJSON geometry and apply styling derived from its properties.
export function createSVGPathElement(geojson, opts = {}) {
  if (typeof document === 'undefined') return null

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', geoJSONToSVGPath(geojson, opts))
  applyGeoJSONStyle(path, geojson, opts)
  group.appendChild(path)

  const points = getGeoJSONPoints(geojson)
  points.forEach((coord) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const [x, y] = (opts.projection || defaultProjection)(coord)
    circle.setAttribute('cx', x)
    circle.setAttribute('cy', y)
    circle.setAttribute('r', opts.radius || '9')
    circle.setAttribute('fill', getMarkerColor(geojson, opts))
    circle.setAttribute('stroke', getStrokeColor(geojson, opts))
    circle.setAttribute('stroke-width', opts.strokeWidth || '1')
    group.appendChild(circle)
  })

  return group
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

// Extract point coordinates from Point, MultiPoint, or GeometryCollection inputs.
export function getGeoJSONPoints(geojson) {
  const t = geojson && geojson.type
  if (!geojson || !t) return []

  if (t === 'Feature') return getGeoJSONPoints(geojson.geometry)
  if (t === 'FeatureCollection') return geojson.features.flatMap((feature) => getGeoJSONPoints(feature))
  if (t === 'GeometryCollection') return geojson.geometries.flatMap((geometry) => getGeoJSONPoints(geometry))
  if (t === 'Point') return [geojson.coordinates]
  if (t === 'MultiPoint') return geojson.coordinates

  return []
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
