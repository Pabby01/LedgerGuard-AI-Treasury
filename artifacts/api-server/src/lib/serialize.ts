export function serializeDates<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = v instanceof Date ? v.toISOString() : v;
  }
  return result as T;
}

export function serializeList<T extends Record<string, any>>(list: T[]): T[] {
  return list.map(serializeDates);
}
