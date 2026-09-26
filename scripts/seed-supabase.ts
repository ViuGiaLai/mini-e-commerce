import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { movieSeed, type Movie } from "../lib/movies";
import {
  defaultSettings,
  viewerSeed,
  type SiteSettings,
  type Viewer,
} from "../lib/admin-data";

loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Thiếu SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY.",
  );
}

const client = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const toRow = (movie: Movie) => ({
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
  description: movie.description,
  colors: movie.colors,
  featured: Boolean(movie.featured),
  update_day: movie.updateDay,
  status: movie.status,
  video: movie.video,
  poster_key: movie.poster || null,
  subtitle_key: movie.subtitle || null,
  audio_key: movie.audio || null,
});

const toUserRow = (viewer: Viewer) => ({
  id: viewer.id,
  name: viewer.name,
  email: viewer.email.toLowerCase(),
  role: viewer.role,
  status: viewer.status,
  plan: viewer.plan,
  joined_at: viewer.joinedAt,
  last_active: viewer.lastActive,
  watches: viewer.watches,
});

const toSettingsRow = (settings: SiteSettings) => ({
  id: 1,
  site_name: settings.siteName,
  tagline: settings.tagline,
  support_email: settings.supportEmail.toLowerCase(),
  maintenance: settings.maintenance,
  allow_registration: settings.allowRegistration,
  show_view_count: settings.showViewCount,
  items_per_page: settings.itemsPerPage,
});

async function seed() {
  const { error: movieError } = await client
    .from("movies")
    .upsert(movieSeed.map(toRow), { onConflict: "id" });

  if (movieError) {
    throw new Error(`Không thể seed phim: ${movieError.message}`);
  }

  const { error: userError } = await client
    .from("app_users")
    .upsert(viewerSeed.map(toUserRow), { onConflict: "id" });

  if (userError) {
    throw new Error(`Không thể seed người dùng: ${userError.message}`);
  }

  const { error: settingsError } = await client
    .from("site_settings")
    .upsert(toSettingsRow(defaultSettings), { onConflict: "id" });

  if (settingsError) {
    throw new Error(`Không thể seed cấu hình: ${settingsError.message}`);
  }

  console.log(
    `Đã đồng bộ ${movieSeed.length} phim, ${viewerSeed.length} người dùng và cấu hình website lên Supabase.`,
  );
}

seed().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
