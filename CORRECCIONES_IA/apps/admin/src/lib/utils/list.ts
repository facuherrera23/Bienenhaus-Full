export function getListData<T>(data: unknown): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];
    if (typeof data === 'object' && data !== null && 'data' in data) {
        return (data as { data: T[] }).data ?? [];
    }
    return [];
}
