    import {geoJSONToSVGPath} from './geojson-to-svg.js'

    // Oklahoma boundary in GeoJSON lon/lat coordinates
    const geojson = {
  "coordinates": 
[
{
"lat": 35.895431173,
"lng": -97.312880319
},
{
"lat": 35.895022681,
"lng": -97.312864226
},
{
"lat": 35.895024854,
"lng": -97.312612098
},
{
"lat": 35.895431173,
"lng": -97.312636238
},
{
"lat": 35.895431173,
"lng": -97.312880319
}
],
  "type": "Polygon"
 }

    const [minX, minY, maxX, maxY] = geojson.coordinates[0].reduce(
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

    const path = geoJSONToSVGPath(geojson, { projection })

    console.log(path)