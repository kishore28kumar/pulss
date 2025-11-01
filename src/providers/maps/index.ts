// Maps Provider Interface
export interface MapProvider {
  renderMap(container: HTMLElement, options: MapOptions): void
  updateMarkers(markers: MapMarker[]): void
  drawRoute?(from: MapPoint, to: MapPoint): void
}

export interface MapOptions {
  center: MapPoint
  zoom: number
  markers?: MapMarker[]
}

export interface MapPoint {
  lat: number
  lng: number
}

export interface MapMarker extends MapPoint {
  id: string
  title?: string
  type?: 'customer' | 'delivery' | 'store'
}

import { GoogleMapProvider } from './google'
import { MockMapProvider } from './mock'

// Provider factory
export const createMapProvider = (provider: string): MapProvider => {
  switch (provider) {
    case 'google':
      return new GoogleMapProvider()
    default:
      return new MockMapProvider()
  }
}