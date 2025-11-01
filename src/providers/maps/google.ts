import { MapProvider, MapOptions, MapMarker, MapPoint } from './index'

declare global {
  interface Window {
    google: any
    initGoogleMap: () => void
  }
}

export class GoogleMapProvider implements MapProvider {
  private map?: any
  private markers: any[] = []
  private directionsService?: any
  private directionsRenderer?: any

  constructor() {
    this.loadGoogleMapsAPI()
  }

  private async loadGoogleMapsAPI(): Promise<void> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey || apiKey === 'placeholder-google-maps-api-key') {
      console.warn('Google Maps API key not configured')
      return
    }

    if (window.google) return

    return new Promise((resolve) => {
      window.initGoogleMap = () => {
        this.directionsService = new window.google.maps.DirectionsService()
        this.directionsRenderer = new window.google.maps.DirectionsRenderer()
        resolve()
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap&libraries=geometry`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    })
  }

  async renderMap(container: HTMLElement, options: MapOptions): Promise<void> {
    if (!window.google) {
      // Fallback to mock display
      container.innerHTML = `
        <div class="w-full h-full bg-muted rounded-lg flex items-center justify-center border">
          <div class="text-center p-4">
            <div class="text-xl mb-2">🗺️</div>
            <div class="font-medium">Google Maps</div>
            <div class="text-sm text-muted-foreground">API key required</div>
          </div>
        </div>
      `
      return
    }

    this.map = new window.google.maps.Map(container, {
      center: { lat: options.center.lat, lng: options.center.lng },
      zoom: options.zoom,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#f5f5f5' }]
        }
      ]
    })

    if (this.directionsRenderer) {
      this.directionsRenderer.setMap(this.map)
    }

    if (options.markers) {
      this.updateMarkers(options.markers)
    }
  }

  updateMarkers(markers: MapMarker[]): void {
    // Clear existing markers
    this.markers.forEach(marker => marker.setMap(null))
    this.markers = []

    if (!this.map || !window.google) return

    // Add new markers
    markers.forEach(markerData => {
      const icon = this.getMarkerIcon(markerData.type)
      
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: this.map,
        title: markerData.title,
        icon: icon
      })

      this.markers.push(marker)
    })
  }

  drawRoute(from: MapPoint, to: MapPoint): void {
    if (!this.directionsService || !this.directionsRenderer) return

    this.directionsService.route({
      origin: from,
      destination: to,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      if (status === 'OK') {
        this.directionsRenderer.setDirections(result)
      }
    })
  }

  private getMarkerIcon(type?: string): any {
    const colors = {
      customer: '#3b82f6',
      delivery: '#10b981',
      store: '#f59e0b'
    }

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: colors[type as keyof typeof colors] || '#6b7280',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  }
}