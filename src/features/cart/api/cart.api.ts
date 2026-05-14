import apiClient from '../../../shared/api/client';

export interface ServerCartItem {
  id: number;
  meal_item_id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ServerCart {
  items: ServerCartItem[];
  total_items: number;
  total_price: number;
}

export const cartApi = {
  async get(): Promise<ServerCart> {
    const { data } = await apiClient.get<ServerCart>('/cart/');
    return data;
  },

  async sync(items: Array<{ meal_item_id: number; quantity: number }>): Promise<ServerCart> {
    const { data } = await apiClient.post<ServerCart>('/cart/sync/', { items });
    return data;
  },

  async add(mealItemId: number, quantity = 1): Promise<ServerCart> {
    const { data } = await apiClient.post<ServerCart>('/cart/add/', {
      meal_item_id: mealItemId,
      quantity,
    });
    return data;
  },

  async update(itemId: number, quantity: number): Promise<ServerCart> {
    const { data } = await apiClient.patch<ServerCart>(`/cart/update/${itemId}/`, {
      quantity,
    });
    return data;
  },

  async remove(itemId: number): Promise<ServerCart> {
    const { data } = await apiClient.delete<ServerCart>(`/cart/remove/${itemId}/`);
    return data;
  },

  async clear(): Promise<void> {
    await apiClient.delete('/cart/clear/');
  },
};
