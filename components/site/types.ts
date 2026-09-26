import type { Dispatch, SetStateAction } from "react";
import type { Account, HistoryItem, ThemeMode } from "@/lib/app-types";
import type { Movie } from "@/lib/movies";

export type Navigate = (path: string) => void;
export type ToggleFavorite = (id: number) => void;
export type WatchMovie = (movie: Movie, episode?: number) => void;

export type MovieFormat = "all" | "series" | "single";
export type MovieStatusFilter =
  "all" | "Đang chiếu" | "Hoàn thành" | "Sắp chiếu";
export type MovieSortOption = "new" | "views" | "rating" | "year";

export type MovieCollectionProps = {
  movies: Movie[];
  go: Navigate;
  favorites: number[];
  toggleFavorite: ToggleFavorite;
};

export type HeaderProps = {
  user: Account | null;
  go: Navigate;
  logout: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  pathname?: string;
};

export type HistoryPageProps = {
  movies: Movie[];
  history: HistoryItem[];
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>;
  go: Navigate;
  watch: WatchMovie;
};
