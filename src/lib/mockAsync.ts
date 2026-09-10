// Wraps a fixture-derived value in a Promise with artificial latency, so
// the services/ layer feels like a real API today and can be swapped for
// one later without touching any component.

export function mockAsync<T>(value: T, delayMs = 350): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delayMs)
  })
}

export function mockAsyncCompute<T>(compute: () => T, delayMs = 350): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(compute()), delayMs)
  })
}
