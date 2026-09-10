let counter = 0

/** Simple, dependency-free unique id generator for in-memory mock data. */
export function makeId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}
