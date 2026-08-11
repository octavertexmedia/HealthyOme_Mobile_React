export { useCurrentLocation } from './hooks/useCurrentLocation';
export type { CurrentLocationResult, LocationErrorReason } from './hooks/useCurrentLocation';
export { locationStorage } from './api/locationStorage';
export type { PersistedLocation } from './api/locationStorage';
export {
  LOCATION_PERMISSION_KEY,
  LOCATION_LABEL_KEY,
  LOCATION_AREA_ID_KEY,
} from './api/locationStorage';
