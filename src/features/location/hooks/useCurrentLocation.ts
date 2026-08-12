import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export type LocationErrorReason = 'permission-denied' | 'unavailable' | 'error';

export interface CurrentLocationResult {
  label: string;
  latitude: number;
  longitude: number;
}

interface UseCurrentLocationState {
  loading: boolean;
  error: LocationErrorReason | null;
}

// Builds a readable city label from a reverse-geocoded address.
function buildLabel(place: Location.LocationGeocodedAddress | undefined): string {
  if (!place) return 'Current location';
  const parts = [place.city || place.district || place.subregion, place.region].filter(
    (p): p is string => !!p && p.trim().length > 0
  );
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length > 0 ? unique.join(', ') : 'Current location';
}

/**
 * Requests foreground location permission, reads the device coordinates and
 * reverse-geocodes them to a human-readable city label.
 *
 * Returns null on failure and sets `error` so the caller can fall back
 * (e.g. open the delivery-area picker on permission-denied).
 */
export function useCurrentLocation() {
  const [state, setState] = useState<UseCurrentLocationState>({ loading: false, error: null });

  const detect = useCallback(async (): Promise<CurrentLocationResult | null> => {
    setState({ loading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setState({ loading: false, error: 'permission-denied' });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      let label = 'Current location';
      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });
        label = buildLabel(places[0]);
      } catch {
        // Reverse geocoding can fail (offline / no provider); keep coords + generic label.
      }

      setState({ loading: false, error: null });
      return { label, latitude, longitude };
    } catch {
      setState({ loading: false, error: 'error' });
      return null;
    }
  }, []);

  return { detect, loading: state.loading, error: state.error };
}
