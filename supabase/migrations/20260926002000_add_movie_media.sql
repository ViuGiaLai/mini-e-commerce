-- R2 object keys associated with a movie. The existing video column stores
-- either a legacy local URL or an R2 object key.

alter table public.movies
  add column if not exists poster_key text,
  add column if not exists subtitle_key text,
  add column if not exists audio_key text;

alter table public.movies
  add constraint movies_poster_key_safe
    check (poster_key is null or poster_key like 'movies/%'),
  add constraint movies_subtitle_key_safe
    check (subtitle_key is null or subtitle_key like 'movies/%'),
  add constraint movies_audio_key_safe
    check (audio_key is null or audio_key like 'movies/%');
