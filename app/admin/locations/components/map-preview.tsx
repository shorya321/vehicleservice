'use client'

import { GoogleMap, Marker } from '@react-google-maps/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { useGoogleMaps } from './google-maps-provider'

interface MapPreviewProps {
  latitude: number | null
  longitude: number | null
  name?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
}

const defaultCenter = {
  lat: 25.2048, // Dubai
  lng: 55.2708,
}

export function MapPreview({ latitude, longitude, name }: MapPreviewProps) {
  const { isLoaded, loadError } = useGoogleMaps()

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Unable to load map</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Error loading Google Maps. Please check your API key.
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Preview</CardTitle>
          <CardDescription>Loading map...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const center = latitude && longitude 
    ? { lat: latitude, lng: longitude }
    : defaultCenter

  const hasCoordinates = latitude !== null && longitude !== null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Preview</CardTitle>
        <CardDescription>
          {hasCoordinates 
            ? 'The marker shows the selected location'
            : 'Select an address to see the location on the map'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={hasCoordinates ? 15 : 10}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {hasCoordinates && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              title={name || 'Selected Location'}
            />
          )}
        </GoogleMap>
      </CardContent>
    </Card>
  )
}