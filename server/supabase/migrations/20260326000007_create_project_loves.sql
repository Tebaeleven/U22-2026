-- いいね管理テーブル
create table public.project_loves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id bigint references public.projects(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);

alter table public.project_loves enable row level security;

-- 誰でも閲覧可能（いいね数の確認用）
create policy "project_loves_select_all" on public.project_loves
  for select using (true);

-- 認証済みユーザーが自分のいいねのみ追加可能
create policy "project_loves_insert_own" on public.project_loves
  for insert with check (auth.uid() = user_id);

-- 自分のいいねのみ削除可能（unlove）
create policy "project_loves_delete_own" on public.project_loves
  for delete using (auth.uid() = user_id);

-- いいねトグル用RPC（atomic counter update）
create or replace function public.toggle_project_love(p_project_id bigint)
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
    select 1 from public.project_loves
    where user_id = v_user_id and project_id = p_project_id
  ) into v_exists;

  if v_exists then
    delete from public.project_loves
    where user_id = v_user_id and project_id = p_project_id;

    update public.projects
    set loves = greatest(loves - 1, 0)
    where id = p_project_id;

    return false; -- unloved
  else
    insert into public.project_loves (user_id, project_id)
    values (v_user_id, p_project_id);

    update public.projects
    set loves = loves + 1
    where id = p_project_id;

    return true; -- loved
  end if;
end;
$$;
