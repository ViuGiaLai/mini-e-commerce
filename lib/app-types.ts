export type Account = {
  email: string;
  name: string;
  role: "admin" | "user";
};

export type HistoryItem = {
  movieId: number;
  episode: number;
  watchedAt: string;
  progress: number;
};

export type ThemeMode = "dark" | "light";
