import apiClient from '../../../shared/api/client';
import type { DeliveryArea } from '../../delivery-areas/api/deliveryAreas.api';

export interface UserAddress {
  id: number;
  label?: string;
  address: string;
  address_line1?: string;
  address_line2?: string;
  pincode?: string;
  landmark?: string;
  contact_number?: string;
  delivery_area?: DeliveryArea | null;
  is_default?: boolean;
  default_meal_time_ids?: number[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateAddressPayload {
  label?: string;
  address?: string;
  address_line1?: string;
  address_line2?: string;
  pincode?: string;
  landmark?: string;
  contact_number?: string;
  delivery_area_id?: number | null;
  is_default?: boolean;
  default_meal_time_ids?: number[];
}

export const addressesApi = {
  async list(): Promise<UserAddress[]> {
    const { data } = await apiClient.get<UserAddress[]>('/addresses/');
    return Array.isArray(data) ? data : [];
  },

  async detail(id: number): Promise<UserAddress> {
    const { data } = await apiClient.get<UserAddress>(`/addresses/${id}/`);
    return data;
  },

  async create(payload: CreateAddressPayload): Promise<UserAddress> {
    const { data } = await apiClient.post<UserAddress>('/addresses/', payload);
    return data;
  },

  async update(id: number, payload: Partial<CreateAddressPayload>): Promise<UserAddress> {
    const { data } = await apiClient.put<UserAddress>(`/addresses/${id}/`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/addresses/${id}/`);
  },

  async setDefault(id: number): Promise<UserAddress> {
    const { data } = await apiClient.put<UserAddress>(`/addresses/${id}/`, { is_default: true });
    return data;
  },
};
