import apiClient from '../../shared/api/client';

export interface NotificationPrefs {
  order_updates: boolean;
  promotions: boolean;
  subscription_reminders: boolean;
  reward_alerts: boolean;
}

export type PrefKey = keyof NotificationPrefs;

export const preferencesApi = {
  async get(): Promise<NotificationPrefs> {
    const { data } = await apiClient.get<NotificationPrefs>('/notifications/preferences/');
    return data;
  },

  async patch(updates: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    const { data } = await apiClient.patch<NotificationPrefs>(
      '/notifications/preferences/',
      updates
    );
    return data;
  },
};
