-- Add optional episodes JSONB column to movies table
-- Each episode item is: { "episode": 1, "video": "movies/.../video.mp4", "title": "Tập 1", "duration": 45 }

alter table public.movies
  add column if not exists episodes jsonb default '[]'::jsonb;
