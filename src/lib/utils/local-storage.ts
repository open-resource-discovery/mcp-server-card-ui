export interface StoredJsonResult<T> {
  value: T;
  error?: string;
}

export function getStoredJson<T>(key: string, fallback: T): T {
  return getStoredJsonResult(key, fallback).value;
}

export function getStoredJsonResult<T>(
  key: string,
  fallback: T,
): StoredJsonResult<T> {
  if (typeof window === "undefined") return { value: fallback };
  try {
    const raw = localStorage.getItem(key);
    return { value: raw !== null ? (JSON.parse(raw) as T) : fallback };
  } catch (error) {
    return {
      value: fallback,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function setStoredJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently handle QuotaExceededError or other storage errors
  }
}

export function getStored(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function setStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Silently handle QuotaExceededError or other storage errors
  }
}

export function removeStored(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently handle storage errors
  }
}
