import { authApi } from '../api/auth.api';
import { tokenStore } from '../../../shared/storage/tokens';
import { useAuthStore } from './auth.store';
import { queryClient } from '../../../shared/api/queryClient';
import { useCartStore } from '../../cart/store/cart.store';
import { cartApi } from '../../cart/api/cart.api';

jest.mock('../../cart/api/cart.api', () => ({ cartApi: { update: jest.fn(), clear: jest.fn() } }));

jest.mock('../../../shared/storage/mmkv', () => ({
  zustandStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../shared/storage/tokens', () => ({
  tokenStore: {
    getAccess: jest.fn(),
    getRefresh: jest.fn(),
    setPair: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../api/auth.api', () => ({
  authApi: {
    getProfile: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../notifications/registerPushToken', () => ({
  unregisterPushToken: jest.fn(),
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedTokenStore = tokenStore as jest.Mocked<typeof tokenStore>;

const user = {
  id: 7,
  username: 'customer',
  email: 'customer@example.com',
  first_name: 'Healthy',
  last_name: 'Customer',
};

describe('auth session restoration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      sessionRevision: 0,
    });
    useCartStore.setState({ items: [], totalItems: 0, totalPrice: 0, ownerId: null });
  });

  it('does not trust persisted auth when the SecureStore pair is absent', async () => {
    mockedTokenStore.getAccess.mockResolvedValue(null);
    mockedTokenStore.getRefresh.mockResolvedValue('refresh');

    await expect(useAuthStore.getState().restoreSession()).resolves.toBe(false);
    expect(mockedAuthApi.getProfile).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('marks the session authenticated only after the profile request succeeds', async () => {
    mockedTokenStore.getAccess
      .mockResolvedValueOnce('access')
      .mockResolvedValueOnce('rotated-access');
    mockedTokenStore.getRefresh
      .mockResolvedValueOnce('refresh')
      .mockResolvedValueOnce('refresh');
    mockedAuthApi.getProfile.mockResolvedValue(user);

    await expect(useAuthStore.getState().restoreSession()).resolves.toBe(true);
    expect(useAuthStore.getState()).toMatchObject({
      user,
      isAuthenticated: true,
      token: 'rotated-access',
      refreshToken: 'refresh',
    });
  });

  it('stays signed out when server validation fails', async () => {
    mockedTokenStore.getAccess.mockResolvedValue('access');
    mockedTokenStore.getRefresh.mockResolvedValue('refresh');
    mockedAuthApi.getProfile.mockRejectedValue(new Error('unauthorized'));
    useAuthStore.setState({ user, isAuthenticated: true });

    await expect(useAuthStore.getState().restoreSession()).resolves.toBe(false);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
    });
  });

  it('clears cached customer data and the local cart even when remote logout fails', async () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    queryClient.setQueryData(['orders'], [{ id: 1 }]);
    useCartStore.setState({ ownerId: user.id, items: [{ id: '1', serverItemId: 3, name: 'Meal', price: 100, qty: 1 }], totalPrice: 100, totalItems: 1 });
    mockedTokenStore.getRefresh.mockResolvedValue('refresh');
    mockedAuthApi.logout.mockRejectedValue(new Error('offline'));
    await useAuthStore.getState().logout();
    expect(queryClient.getQueryData(['orders'])).toBeUndefined();
    expect(useCartStore.getState().items).toEqual([]);
    expect(cartApi.clear).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockedTokenStore.clear).toHaveBeenCalled();
  });

  it('ignores a cart response from a session that has already ended', async () => {
    useAuthStore.setState({ user, isAuthenticated: true });
    useCartStore.setState({ ownerId: user.id, items: [{ id: '1', serverItemId: 3, name: 'Meal', price: 100, qty: 1 }] });
    let resolve!: (value: any) => void;
    jest.mocked(cartApi.update).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    useCartStore.getState().updateQuantity('1', 2);
    await useAuthStore.getState().clearSession();
    resolve({ items: [{ id: 3, meal_item: { id: 1, name: 'Meal', price: 100 }, quantity: 2 }] });
    await Promise.resolve();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('does not restore an earlier session after it has been cleared', async () => {
    mockedTokenStore.getAccess.mockResolvedValue('access');
    mockedTokenStore.getRefresh.mockResolvedValue('refresh');
    let resolve!: (value: typeof user) => void;
    mockedAuthApi.getProfile.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const restoring = useAuthStore.getState().restoreSession();
    await Promise.resolve();
    await Promise.resolve();
    await useAuthStore.getState().clearSession();
    resolve(user);
    await expect(restoring).resolves.toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
