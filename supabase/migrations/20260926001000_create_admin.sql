-- Private user-management data and the singleton public site configuration.
-- Run after 20260926000000_create_movies.sql.

create table if not exists public.app_users (
  id bigint primary key,
  name text not null check (char_length(name) between 1 and 100),
  email text not null unique,
  role text not null check (role in ('admin', 'user')),
  status text not null check (status in ('Đang hoạt động', 'Đã khóa')),
  plan text not null check (plan in ('Miễn phí', 'VIP')),
  joined_at date not null,
  last_active timestamptz not null,
  watches integer not null default 0 check (watches >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_status_idx on public.app_users (status);
create index if not exists app_users_plan_idx on public.app_users (plan);

alter table public.app_users enable row level security;
revoke all on public.app_users from anon, authenticated;
grant all on public.app_users to service_role;

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null check (char_length(site_name) between 1 and 80),
  tagline text not null check (char_length(tagline) between 1 and 160),
  support_email text not null,
  maintenance boolean not null default false,
  allow_registration boolean not null default true,
  show_view_count boolean not null default true,
  items_per_page integer not null default 20 check (items_per_page between 8 and 100),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke insert, update, delete on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read"
on public.site_settings
for select
to anon, authenticated
using (true);

insert into public.site_settings (
  id,
  site_name,
  tagline,
  support_email,
  maintenance,
  allow_registration,
  show_view_count,
  items_per_page
) values (
  1,
  'ViuFilm3D',
  'Thế giới hoạt hình 3D nguyên bản',
  'support@viufilm3d.local',
  false,
  true,
  true,
  20
)
on conflict (id) do nothing;

create or replace function public.set_admin_updated_at()
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

drop trigger if exists app_users_set_updated_at on public.app_users;
create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_admin_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_admin_updated_at();

