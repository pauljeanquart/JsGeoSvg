import { geoJSONToSVGPath } from './geojson-to-svg.js'

// plugin to take GeoJson polygon as data-polygon render svg version
function initializeJsGeoSvg() {
    const svgElements = document.querySelectorAll('.js-geo-svg');
    svgElements.forEach(svgElement => {
        const polygon = JSON.parse(svgElement.getAttribute('data-polygon'));
        // Process each GeoJSON polygon and render it as an SVG path

        const [minX, minY, maxX, maxY] = polygon.coordinates[0].reduce(
            ([minX, minY, maxX, maxY], [lon, lat]) => [
                Math.min(minX, lon),
                Math.min(minY, lat),
                Math.max(maxX, lon),
                Math.max(maxY, lat)
            ],
            [Infinity, Infinity, -Infinity, -Infinity]
        )

        const width = 800
        const height = 600
        const padding = 20
        const scale = Math.min(
            (width - padding * 2) / (maxX - minX),
            (height - padding * 2) / (maxY - minY)
        )

        const projection = ([lon, lat]) => {
            const x = (lon - minX) * scale + padding
            const y = height - padding - (lat - minY) * scale
            return [x, y]
        }

        const path = geoJSONToSVGPath(polygon, { projection })

        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        p.setAttribute('d', path)
        p.setAttribute('fill', '#4da6ff')
        p.setAttribute('fill-rule', 'evenodd')
        p.setAttribute('stroke', '#003366')
        p.setAttribute('stroke-width', '0.5')
        svgElement.appendChild(p)
    });
}

initializeJsGeoSvg();


