import type { Movie } from "@/lib/movies";
import {
  createSupabaseAdminClient,
  createSupabaseReadClient,
} from "@/lib/supabase/server";
import { DatabaseError } from "@/lib/server/errors";

type MovieRow = {
  id: number;
  slug: string;
  title: string;
  original_title: string;
  genres: string[];
  year: number;
  episode: number;
  total_episodes: number;
  quality: Movie["quality"];
  rating: number | string;
  views: number;
  duration: number;
  studio: string;
  director: string;
  description: string;
  colors: string[];
  featured: boolean;
  update_day: string;
  status: Movie["status"];
  video: string;
  poster_key: string | null;
  subtitle_key: string | null;
  audio_key: string | null;
  trailer_key: string | null;
};

const EPISODES_TAG_PREFIX = "<!--viufilm-episodes:";
const EPISODES_TAG_SUFFIX = "-->";

const extractEpisodes = (
  rawDescription: string,
  rawEpisodes?: unknown,
): { description: string; episodes?: Movie["episodes"] } => {
  let episodes: Movie["episodes"];
  if (Array.isArray(rawEpisodes) && rawEpisodes.length > 0) {
    episodes = rawEpisodes as Movie["episodes"];
  }

  let description = rawDescription || "";
  const startIndex = description.indexOf(EPISODES_TAG_PREFIX);
  if (startIndex !== -1) {
    const endIndex = description.indexOf(EPISODES_TAG_SUFFIX, startIndex);
    if (endIndex !== -1) {
      const payload = description.substring(
        startIndex + EPISODES_TAG_PREFIX.length,
        endIndex,
      );
      if (!episodes) {
        try {
          const parsed = JSON.parse(decodeURIComponent(payload));
          if (Array.isArray(parsed) && parsed.length > 0) {
            episodes = parsed;
          }
        } catch {
          // ignore parsing error
        }
      }
      description = (
        description.substring(0, startIndex) +
        description.substring(endIndex + EPISODES_TAG_SUFFIX.length)
      ).trim();
    }
  }

  return { description, episodes };
};

const packDescriptionWithEpisodes = (
  description: string,
  episodes?: Movie["episodes"],
): string => {
  let clean = description || "";
  const startIndex = clean.indexOf(EPISODES_TAG_PREFIX);
  if (startIndex !== -1) {
    const endIndex = clean.indexOf(EPISODES_TAG_SUFFIX, startIndex);
    if (endIndex !== -1) {
      clean = (
        clean.substring(0, startIndex) +
        clean.substring(endIndex + EPISODES_TAG_SUFFIX.length)
      ).trim();
    }
  }
  if (!episodes || !episodes.length) return clean;
  return `${clean}\n\n${EPISODES_TAG_PREFIX}${encodeURIComponent(JSON.stringify(episodes))}${EPISODES_TAG_SUFFIX}`;
};

const fromRow = (row: MovieRow & { episodes?: unknown }): Movie => {
  const { description, episodes } = extractEpisodes(
    row.description,
    row.episodes,
  );
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    originalTitle: row.original_title,
    genres: row.genres,
    year: row.year,
    episode: row.episode,
    totalEpisodes: row.total_episodes,
    quality: row.quality,
    rating: Number(row.rating),
    views: Number(row.views),
    duration: row.duration,
    studio: row.studio,
    director: row.director,
    description,
    episodes,
    colors: [row.colors[0], row.colors[1]],
    featured: row.featured,
    updateDay: row.update_day,
    status: row.status,
    video: row.video,
    trailer: row.trailer_key ?? undefined,
    poster: row.poster_key ?? undefined,
    subtitle: row.subtitle_key ?? undefined,
    audio: row.audio_key ?? undefined,
  };
};

const toRow = (movie: Movie): MovieRow => {
  const primaryVideo =
    movie.episodes?.find((e) => e.episode === 1)?.video ||
    movie.episodes?.[0]?.video ||
    movie.video;

  return {
    id: movie.id,
    slug: movie.slug,
    title: movie.title,
    original_title: movie.originalTitle,
    genres: movie.genres,
    year: movie.year,
    episode: movie.episode,
    total_episodes: movie.totalEpisodes,
    quality: movie.quality,
    rating: movie.rating,
    views: movie.views,
    duration: movie.duration,
    studio: movie.studio,
    director: movie.director,
    description: packDescriptionWithEpisodes(movie.description, movie.episodes),
    colors: movie.colors,
    featured: Boolean(movie.featured),
    update_day: movie.updateDay,
    status: movie.status,
    video: primaryVideo,
    poster_key: movie.poster || null,
    subtitle_key: movie.subtitle || null,
    audio_key: movie.audio || null,
    trailer_key: movie.trailer || null,
  };
};

const throwDatabaseError = (message: string) => {
  throw new DatabaseError("Không thể truy cập dữ liệu phim.", message);
};

export const movieRepository = {
  async list(): Promise<Movie[]> {
    const { data, error } = await createSupabaseReadClient()
      .from("movies")
      .select("*")
      .order("id", { ascending: false });

    if (error) throwDatabaseError(error.message);
    return ((data ?? []) as MovieRow[]).map(fromRow);
  },

  async find(id: number): Promise<Movie | null> {
    const { data, error } = await createSupabaseReadClient()
      .from("movies")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throwDatabaseError(error.message);
    return data ? fromRow(data as MovieRow) : null;
  },

  async save(movie: Movie): Promise<Movie> {
    const { data, error } = await createSupabaseAdminClient()
      .from("movies")
      .upsert(toRow(movie), { onConflict: "id" })
      .select("*")
      .single();

    if (error) throwDatabaseError(error.message);
    return fromRow(data as MovieRow);
  },

  async remove(id: number): Promise<boolean> {
    const { data, error } = await createSupabaseAdminClient()
      .from("movies")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throwDatabaseError(error.message);
    return Boolean(data?.length);
  },

  async removeMany(ids: number[]): Promise<number> {
    const { data, error } = await createSupabaseAdminClient()
      .from("movies")
      .delete()
      .in("id", ids)
      .select("id");

    if (error) throwDatabaseError(error.message);
    return data?.length ?? 0;
  },
};
