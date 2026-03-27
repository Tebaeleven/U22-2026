-- プロジェクトテーブル
create table public.projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  instructions text not null default '',
  thumbnail_url text not null default '',
  author_id uuid references public.profiles(id) on delete cascade not null,
  loves integer not null default 0,
  views integer not null default 0,
  remixes integer not null default 0,
  tags text[] not null default '{}',
  featured boolean not null default false,
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- 公開作品または自分の作品は閲覧可能
create policy "projects_select" on public.projects
  for select using (shared = true or auth.uid() = author_id);

-- 本人のみ作成可能
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = author_id);

-- 本人のみ更新可能
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = author_id);

-- 本人のみ削除可能
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = author_id);
