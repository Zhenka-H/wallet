/**
 * Schedules a promise for handling without blocking; errors are swallowed so the
 * caller can ignore the result (e.g. TanStack Query refetch).
 */
export function schedulePromise(promise: Promise<unknown>): undefined {
  promise.catch((): undefined => undefined);
  return undefined;
}
