-- ユーザープロフィールテーブル（auth.users と 1:1）
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text not null default '',
  avatar_url text not null default '',
  bio text not null default '',
  working_on text not null default '',
  country text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS 有効化
alter table public.profiles enable row level security;

-- 誰でも閲覧可能
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- 本人のみ更新可能
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 新規ユーザー登録時に自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, country)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)),
    coalesce(new.raw_user_meta_data->>'country', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
