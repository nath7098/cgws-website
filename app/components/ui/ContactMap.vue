<script setup lang="ts">
import type { Map as LeafletMap } from 'leaflet'

// Brèches coordinates (Indre-et-Loire, 37)
const BRECHES_LAT = 47.4833
const BRECHES_LNG = 0.5167
const DEFAULT_ZOOM = 14

const mapContainerRef = ref<HTMLDivElement | null>(null)
let mapInstance: LeafletMap | null = null

onMounted(async () => {
  if (!mapContainerRef.value) return

  // Dynamic import of Leaflet and its CSS — avoids SSR issues
  await import('leaflet/dist/leaflet.css')
  const L = (await import('leaflet')).default

  mapInstance = L.map(mapContainerRef.value, {
    center: [BRECHES_LAT, BRECHES_LNG],
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance)

  // Custom copper-colored teardrop pin marker (no external image assets needed)
  const markerIcon = L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: #B8650A;
      border: 3px solid #FAF3E3;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 10px rgba(61,26,6,0.45);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  })

  L.marker([BRECHES_LAT, BRECHES_LNG], { icon: markerIcon })
    .addTo(mapInstance)
    .bindPopup(
      '<strong style="font-family:Georgia,serif;color:#1A0B03;">CGWS</strong><br>' +
      '<span style="font-size:12px;color:#7B3B1C;">Brèches · Indre-et-Loire</span>',
    )
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div
    ref="mapContainerRef"
    class="w-full h-full"
    role="application"
    aria-label="Carte OpenStreetMap centrée sur Brèches, Indre-et-Loire"
  />
</template>
