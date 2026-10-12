/** Invalidates asynchronous account work before a session is cleared. */
let generation = 0;
let suspended = false;
const requests = new Set<AbortController>();

export class OfflineSessionChangedError extends Error {
  constructor() {
    super('The account session changed while this operation was running');
    this.name = 'OfflineSessionChangedError';
  }
}

const channel = typeof BroadcastChannel !== 'undefined'
  && (typeof window !== 'undefined' || typeof ServiceWorkerGlobalScope !== 'undefined')
  ? new BroadcastChannel('ai-generator-session-lifecycle')
  : null;

const changeState = (pause: boolean) => {
  generation++;
  suspended = pause;
  for (const request of requests) request.abort();
};

if (channel) channel.onmessage = ({ data }) => {
  if (data === 'suspend' || data === 'resume') changeState(data === 'suspend');
};

export const getOfflineSessionGeneration = () => generation;
export const isOfflineSessionCurrent = (expected: number) => !suspended && expected === generation;
export const assertOfflineSessionCurrent = (expected = generation) => {
  if (!isOfflineSessionCurrent(expected)) throw new OfflineSessionChangedError();
};
export const suspendOfflineSession = () => {
  changeState(true);
  channel?.postMessage('suspend');
};
export const resumeOfflineSession = () => {
  if (!suspended) return;
  changeState(false);
  channel?.postMessage('resume');
};

export const withOfflineSyncLock = async <T>(task: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('ai-generator-offline-sync', task);
  }
  return task();
};

export const withPrivateCacheLock = async <T>(task: () => Promise<T>): Promise<T> => {
  if (typeof navigator !== 'undefined' && navigator.locks?.request) {
    return navigator.locks.request('ai-generator-private-cache', task);
  }
  return task();
};

/** Buffer through the body read so a late response cannot outlive sign-out. */
export const sessionGuardedFetch: typeof fetch = async (input, init) => {
  const expected = generation;
  assertOfflineSessionCurrent(expected);
  const controller = new AbortController();
  const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  requests.add(controller);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const body = response.body ? await response.arrayBuffer() : null;
    assertOfflineSessionCurrent(expected);
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    assertOfflineSessionCurrent(expected);
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    requests.delete(controller);
  }
};
