import { withStartupDeadline } from './startup';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('returns the completed startup value and clears the deadline', async () => {
  await expect(withStartupDeadline(async () => 'ready')).resolves.toBe('ready');
  expect(jest.getTimerCount()).toBe(0);
});
it('propagates storage/session failure without retrying or leaking a timer', async () => {
  const task = jest.fn().mockRejectedValue(new Error('Storage unavailable'));
  await expect(withStartupDeadline(task)).rejects.toThrow('Storage unavailable');
  expect(task).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
it('bounds a hung startup operation and never automatically retries it', async () => {
  const task = jest.fn(() => new Promise(() => {}));
  const result = expect(withStartupDeadline(task)).rejects.toThrow('Startup timed out');
  await jest.advanceTimersByTimeAsync(15000);
  await result;
  expect(task).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});
