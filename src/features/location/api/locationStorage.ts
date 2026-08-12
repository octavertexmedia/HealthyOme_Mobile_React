import { storage } from '../../../shared/storage/mmkv';

// Persisted location keys (via the shared AsyncStorage-backed storage util).
export const LOCATION_PERMISSION_KEY = 'has_location_permission';
export const LOCATION_LABEL_KEY = 'location_label';
export const LOCATION_AREA_ID_KEY = 'location_delivery_area_id';

export interface PersistedLocation {
  hasPermission: boolean;
  label: string | null;
  deliveryAreaId: number | null;
}

export const locationStorage = {
  async save(params: { label: string; hasPermission?: boolean; deliveryAreaId?: number | null }): Promise<void> {
    await storage.set(LOCATION_LABEL_KEY, params.label);
    if (params.hasPermission) {
      await storage.set(LOCATION_PERMISSION_KEY, 'true');
    }
    if (params.deliveryAreaId != null) {
      await storage.set(LOCATION_AREA_ID_KEY, String(params.deliveryAreaId));
    } else {
      await storage.delete(LOCATION_AREA_ID_KEY);
    }
  },

  async setPermission(granted: boolean): Promise<void> {
    await storage.set(LOCATION_PERMISSION_KEY, granted ? 'true' : 'false');
  },

  async get(): Promise<PersistedLocation> {
    const [perm, label, areaId] = await Promise.all([
      storage.getString(LOCATION_PERMISSION_KEY),
      storage.getString(LOCATION_LABEL_KEY),
      storage.getString(LOCATION_AREA_ID_KEY),
    ]);
    return {
      hasPermission: perm === 'true',
      label: label ?? null,
      deliveryAreaId: areaId ? parseInt(areaId, 10) : null,
    };
  },
};
