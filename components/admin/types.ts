import type { Dispatch, SetStateAction } from "react";
import type { SiteSettings, Viewer } from "@/lib/admin-data";
import type { Movie } from "@/lib/movies";

export type Navigate = (path: string) => void;
export type EditMovie = Dispatch<SetStateAction<Movie | null | undefined>>;
export type EditViewer = Dispatch<SetStateAction<Viewer | null | undefined>>;
export type PatchMovie = (id: number, changes: Partial<Movie>) => Promise<void>;
export type PatchViewer = (
  id: number,
  changes: Partial<Viewer>,
) => Promise<void>;

export type AdminPanelProps = {
  movies: Movie[];
  setMovies: Dispatch<SetStateAction<Movie[]>>;
  logout: () => void;
  pathname: string;
  go: Navigate;
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
};
