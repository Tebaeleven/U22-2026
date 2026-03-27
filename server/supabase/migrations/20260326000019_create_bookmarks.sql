-- ブックマークフォルダ
create table public.bookmark_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_bookmark_folders_user on public.bookmark_folders(user_id);

alter table public.bookmark_folders enable row level security;

create policy "bookmark_folders_select_own" on public.bookmark_folders
  for select using (auth.uid() = user_id);

create policy "bookmark_folders_insert_own" on public.bookmark_folders
  for insert with check (auth.uid() = user_id);

create policy "bookmark_folders_update_own" on public.bookmark_folders
  for update using (auth.uid() = user_id);

create policy "bookmark_folders_delete_own" on public.bookmark_folders
  for delete using (auth.uid() = user_id);

-- ブックマーク
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id bigint references public.projects(id) on delete cascade not null,
  folder_id uuid references public.bookmark_folders(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id, project_id)
);

create index idx_bookmarks_user on public.bookmarks(user_id, created_at desc);
create index idx_bookmarks_folder on public.bookmarks(folder_id);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks
  for select using (auth.uid() = user_id);

create policy "bookmarks_insert_own" on public.bookmarks
  for insert with check (auth.uid() = user_id);

create policy "bookmarks_update_own" on public.bookmarks
  for update using (auth.uid() = user_id);

create policy "bookmarks_delete_own" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- ブックマークのトグル（追加/削除）
create or replace function public.toggle_bookmark(
  p_project_id bigint,
  p_folder_id uuid default null
)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.bookmarks
    where user_id = v_user_id and project_id = p_project_id
  ) into v_exists;

  if v_exists then
    delete from public.bookmarks
    where user_id = v_user_id and project_id = p_project_id;
    return false;
  else
    insert into public.bookmarks (user_id, project_id, folder_id)
    values (v_user_id, p_project_id, p_folder_id);
    return true;
  end if;
end;
$$;

-- ブックマークのフォルダ移動
create or replace function public.move_bookmark_to_folder(
  p_project_id bigint,
  p_folder_id uuid default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- フォルダが指定されていればオーナーシップを確認
  if p_folder_id is not null then
    if not exists(
      select 1 from public.bookmark_folders
      where id = p_folder_id and user_id = v_user_id
    ) then
      raise exception 'Folder not found';
    end if;
  end if;

  update public.bookmarks
  set folder_id = p_folder_id
  where user_id = v_user_id and project_id = p_project_id;
end;
$$;
