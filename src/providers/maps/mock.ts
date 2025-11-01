import { MapProvider, MapOptions, MapMarker, MapPoint } from './index'

export class MockMapProvider implements MapProvider {
  private container?: HTMLElement
  private markers: MapMarker[] = []

  renderMap(container: HTMLElement, options: MapOptions): void {
    this.container = container
    this.markers = options.markers || []
    
    // Create mock map UI
    container.innerHTML = `
      <div class="w-full h-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
        <div class="text-center p-4">
          <div class="text-2xl mb-2">🗺️</div>
          <div class="font-medium text-foreground">Map Preview</div>
          <div class="text-sm text-muted-foreground mt-1">
            Center: ${options.center.lat.toFixed(4)}, ${options.center.lng.toFixed(4)}
          </div>
          <div class="text-sm text-muted-foreground">
            Markers: ${this.markers.length}
          </div>
        </div>
      </div>
    `
  }

  updateMarkers(markers: MapMarker[]): void {
    this.markers = markers
    if (this.container) {
      const markerCount = this.container.querySelector('[data-marker-count]')
      if (markerCount) {
        markerCount.textContent = `Markers: ${markers.length}`
      }
    }
  }

  drawRoute(from: MapPoint, to: MapPoint): void {
    console.log('Mock route drawn from', from, 'to', to)
  }
}