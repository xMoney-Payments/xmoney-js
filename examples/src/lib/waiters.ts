interface Waiter<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export function createWaiters<T>() {
  let instance: T | null = null;
  let pending: Waiter<T>[] = [];

  return {
    get: () => instance,
    settle(value: T) {
      instance = value;
      const queued = pending;
      pending = [];
      queued.forEach((waiter) => waiter.resolve(value));
    },
    fail(error: Error) {
      const queued = pending;
      pending = [];
      queued.forEach((waiter) => waiter.reject(error));
    },
    reset() {
      instance = null;
    },
    whenReady(): Promise<T> {
      if (instance) return Promise.resolve(instance);
      return new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      });
    },
  };
}
