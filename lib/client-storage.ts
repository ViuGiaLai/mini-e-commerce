export const storageKeys = {
  favorites: "viufilm3d-favorites",
  history: "viufilm3d-history",
  user: "viufilm3d-user",
  theme: "viufilm3d-theme",
  movies: "viufilm3d-movies",
  viewers: "viufilm3d-viewers",
  settings: "viufilm3d-settings",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing or a full quota must not break the interface.
  }
}
