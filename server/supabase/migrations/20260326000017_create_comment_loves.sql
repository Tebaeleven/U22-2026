-- コメントいいねテーブル
create table public.comment_loves (
  user_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

-- インデックス（コメント別のいいね数取得用）
create index idx_comment_loves_comment_id on public.comment_loves(comment_id);

-- RLS
alter table public.comment_loves enable row level security;

create policy "誰でも閲覧可"
  on public.comment_loves for select using (true);

create policy "認証ユーザーのみ追加"
  on public.comment_loves for insert
  with check (auth.uid() = user_id);

create policy "自分のみ削除"
  on public.comment_loves for delete
  using (auth.uid() = user_id);

-- いいねトグル RPC
create or replace function public.toggle_comment_love(p_comment_id uuid)
returns boolean
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_exists boolean;
begin
  if v_user_id is null then
    raise exception 'ログインが必要です';
  end if;

  select exists(
    select 1 from public.comment_loves
    where user_id = v_user_id and comment_id = p_comment_id
  ) into v_exists;

  if v_exists then
    delete from public.comment_loves
    where user_id = v_user_id and comment_id = p_comment_id;
    return false;
  else
    insert into public.comment_loves (user_id, comment_id)
    values (v_user_id, p_comment_id);
    return true;
  end if;
end;
$$;
