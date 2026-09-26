import { movieSeed, type Movie } from "@/lib/movies";
import { requestApi } from "@/lib/api-client";
import { apiMode } from "@/lib/config";
import { readStorage, storageKeys, writeStorage } from "@/lib/client-storage";

const cloneSeed = () => movieSeed.map((movie) => ({ ...movie }));

const readMockMovies = (): Movie[] => {
  if (typeof window === "undefined")
    return cloneSeed().sort((a, b) => b.id - a.id);

  try {
    const saved = readStorage<Movie[] | null>(storageKeys.movies, null);
    if (saved) return [...saved].sort((a, b) => b.id - a.id);
  } catch {
    // Dữ liệu hỏng sẽ được thay bằng bộ dữ liệu mẫu bên dưới.
  }

  const initialMovies = cloneSeed().sort((a, b) => b.id - a.id);
  writeStorage(storageKeys.movies, initialMovies);
  return initialMovies;
};

const writeMockMovies = (movies: Movie[]) => {
  writeStorage(storageKeys.movies, movies);
};

export const movieGateway = {
  mode: apiMode,

  async list(): Promise<Movie[]> {
    const movies =
      apiMode === "mock"
        ? readMockMovies()
        : await requestApi<Movie[]>("/movies", { cache: "no-store" });
    return [...movies].sort((a, b) => b.id - a.id);
  },

  async save(movie: Movie): Promise<Movie> {
    if (apiMode === "mock") {
      const movies = readMockMovies();
      const exists = movies.some((item) => item.id === movie.id);
      const next = exists
        ? movies.map((item) => (item.id === movie.id ? movie : item))
        : [movie, ...movies];
      const sorted = [...next].sort((a, b) => b.id - a.id);
      writeMockMovies(sorted);
      return movie;
    }

    return requestApi<Movie>(`/movies/${movie.id}`, {
      method: "PUT",
      body: JSON.stringify(movie),
    });
  },

  async remove(id: number): Promise<void> {
    if (apiMode === "mock") {
      writeMockMovies(readMockMovies().filter((movie) => movie.id !== id));
      return;
    }

    await requestApi<null>(`/movies/${id}`, { method: "DELETE" });
  },

  async removeMany(ids: number[]): Promise<void> {
    if (apiMode === "mock") {
      writeMockMovies(
        readMockMovies().filter((movie) => !ids.includes(movie.id)),
      );
      return;
    }

    await requestApi<null>("/movies", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  },
};
