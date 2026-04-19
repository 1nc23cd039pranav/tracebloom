import { Loader } from '@googlemaps/js-api-loader'

let mapsInstance = null

const loader = new Loader({
  apiKey: import.meta.env.VITE_MAPS_KEY,
  version: 'weekly',
  libraries: ['places', 'routes', 'marker']
})

export const initMap = async (elementId, center, zoom = 10) => {
  try {
    const google = await loader.load()
    
    const mapElement = document.getElementById(elementId)
    if (!mapElement) {
      console.error(`Element with id ${elementId} not found`)
      return null
    }

    const map = new google.maps.Map(mapElement, {
      zoom: zoom,
      center: center,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
    })

    mapsInstance = map
    return map
  } catch (error) {
    console.error('Error initializing map:', error)
    return null
  }
}

export const addMarker = async (map, position, label, color = 'green') => {
  try {
    const google = await loader.load()

    const colorMap = {
      green: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      orange: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
      blue: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    }

    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: label,
      icon: colorMap[color] || colorMap.green
    })

    return marker
  } catch (error) {
    console.error('Error adding marker:', error)
    return null
  }
}

export const drawRoute = async (map, origin, destination, color = '#ef4444') => {
  try {
    const google = await loader.load()

    const directionsService = new google.maps.DirectionsService()
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      polylineOptions: {
        strokeColor: color,
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    })

    const result = await directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    })

    directionsRenderer.setDirections(result)

    if (result.routes.length > 0) {
      const leg = result.routes[0].legs[0]
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        distanceValue: leg.distance.value,
        durationValue: leg.duration.value
      }
    }

    return null
  } catch (error) {
    console.error('Error drawing route:', error)
    return null
  }
}

// Draw route with dotted line pattern
export const drawDottedRoute = async (map, origin, destination, color = '#ef4444') => {
  try {
    const google = await loader.load()

    const directionsService = new google.maps.DirectionsService()
    
    const result = await directionsService.route({
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    })

    if (result.routes.length > 0) {
      const polyline = new google.maps.Polyline({
        path: result.routes[0].overview_path,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map: map,
        icons: [
          {
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0px',
            repeat: '10px'
          }
        ]
      })

      const leg = result.routes[0].legs[0]
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        distanceValue: leg.distance.value,
        durationValue: leg.duration.value,
        polyline: polyline
      }
    }

    return null
  } catch (error) {
    console.error('Error drawing dotted route:', error)
    return null
  }
}

export const clearRoute = (renderer) => {
  if (renderer) {
    renderer.setMap(null)
  }
}

export const getGoogleMaps = async () => {
  return await loader.load()
}
