-- Add trailer_key column to movies table
-- Stores the R2 object key or URL of the movie's trailer video

alter table public.movies
  add column if not exists trailer_key text default null;
