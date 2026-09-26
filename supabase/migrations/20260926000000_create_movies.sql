create table if not exists public.movies (
  id bigint primary key,
  slug text not null unique,
  title text not null,
  original_title text not null,
  genres text[] not null default '{}',
  year integer not null check (year between 2000 and 2100),
  episode integer not null default 0 check (episode >= 0),
  total_episodes integer not null check (total_episodes > 0),
  quality text not null check (quality in ('4K', 'Full HD')),
  rating numeric(3, 1) not null default 0 check (rating between 0 and 10),
  views bigint not null default 0 check (views >= 0),
  duration integer not null check (duration > 0),
  studio text not null,
  director text not null,
  description text not null,
  colors text[] not null check (cardinality(colors) = 2),
  featured boolean not null default false,
  update_day text not null,
  status text not null check (status in ('Đang chiếu', 'Hoàn thành', 'Sắp chiếu')),
  video text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_episode_progress check (episode <= total_episodes)
);

create index if not exists movies_status_idx on public.movies (status);
create index if not exists movies_featured_idx on public.movies (featured);
create index if not exists movies_views_idx on public.movies (views desc);

alter table public.movies enable row level security;

revoke insert, update, delete on public.movies from anon, authenticated;
grant select on public.movies to anon, authenticated;
grant all on public.movies to service_role;

drop policy if exists "movies_public_read" on public.movies;
create policy "movies_public_read"
on public.movies
for select
to anon, authenticated
using (true);

create or replace function public.set_movies_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists movies_set_updated_at on public.movies;
create trigger movies_set_updated_at
before update on public.movies
for each row execute function public.set_movies_updated_at();
