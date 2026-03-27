-- フォロー管理テーブル
create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

alter table public.follows enable row level security;

-- 誰でも閲覧可能
create policy "follows_select_all" on public.follows
  for select using (true);

-- 自分がフォローする操作のみ
create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);

-- 自分のフォローのみ解除可能
create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- フォロートグル用RPC
create or replace function public.toggle_follow(p_following_id uuid)
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

  if v_user_id = p_following_id then
    raise exception 'Cannot follow yourself';
  end if;

  select exists(
    select 1 from public.follows
    where follower_id = v_user_id and following_id = p_following_id
  ) into v_exists;

  if v_exists then
    delete from public.follows
    where follower_id = v_user_id and following_id = p_following_id;
    return false; -- unfollowed
  else
    insert into public.follows (follower_id, following_id)
    values (v_user_id, p_following_id);
    return true; -- followed
  end if;
end;
$$;

-- フォロワー数・フォロー数を取得
create or replace function public.get_follow_counts(p_user_id uuid)
returns table(follower_count bigint, following_count bigint)
language sql
security invoker set search_path = ''
as $$
  select
    (select count(*) from public.follows where following_id = p_user_id) as follower_count,
    (select count(*) from public.follows where follower_id = p_user_id) as following_count;
$$;
