-- コメントテーブル
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id bigint references public.projects(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- 誰でも閲覧可能
create policy "comments_select_all" on public.comments
  for select using (true);

-- 認証済みユーザーのみ投稿可能
create policy "comments_insert_auth" on public.comments
  for insert with check (auth.uid() = author_id);

-- 本人のみ削除可能
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);
