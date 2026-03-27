-- スタジオテーブル
create table public.studios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  thumbnail_url text not null default '',
  created_by uuid references public.profiles(id) on delete cascade not null,
  follower_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- スタジオキュレーター（多対多）
create table public.studio_curators (
  studio_id uuid references public.studios(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (studio_id, user_id)
);

-- スタジオ内プロジェクト（多対多）
create table public.studio_projects (
  studio_id uuid references public.studios(id) on delete cascade,
  project_id bigint references public.projects(id) on delete cascade,
  primary key (studio_id, project_id)
);

alter table public.studios enable row level security;
alter table public.studio_curators enable row level security;
alter table public.studio_projects enable row level security;

create policy "studios_select_all" on public.studios
  for select using (true);

create policy "studio_curators_select_all" on public.studio_curators
  for select using (true);

create policy "studio_projects_select_all" on public.studio_projects
  for select using (true);

-- スタジオ作成は認証済みユーザーのみ
create policy "studios_insert_auth" on public.studios
  for insert with check (auth.uid() = created_by);

-- スタジオ更新は作成者のみ
create policy "studios_update_own" on public.studios
  for update using (auth.uid() = created_by);
