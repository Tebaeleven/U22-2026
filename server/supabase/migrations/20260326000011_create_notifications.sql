-- 通知タイプ
create type public.notification_type as enum ('love', 'comment', 'follow', 'remix');

-- 通知テーブル
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  type public.notification_type not null,
  project_id bigint references public.projects(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- recipient_idで頻繁にクエリするためのインデックス
create index idx_notifications_recipient on public.notifications(recipient_id, created_at desc);
create index idx_notifications_unread on public.notifications(recipient_id) where read = false;

alter table public.notifications enable row level security;

-- 本人の通知のみ閲覧可能
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = recipient_id);

-- 本人のみ更新可能（既読マーク用）
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = recipient_id);

-- 通知作成用の内部関数（自分→自分の通知はスキップ）
create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type public.notification_type,
  p_project_id bigint default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if p_recipient_id = p_actor_id then
    return;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, project_id)
  values (p_recipient_id, p_actor_id, p_type, p_project_id);
end;
$$;

-- トリガー: いいね時に通知
create or replace function public.notify_on_love()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id
  from public.projects where id = NEW.project_id;

  perform public.create_notification(v_author_id, NEW.user_id, 'love', NEW.project_id);
  return NEW;
end;
$$;

create trigger on_project_love_insert
  after insert on public.project_loves
  for each row execute function public.notify_on_love();

-- トリガー: コメント時に通知
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_author_id uuid;
begin
  select author_id into v_author_id
  from public.projects where id = NEW.project_id;

  perform public.create_notification(v_author_id, NEW.author_id, 'comment', NEW.project_id);
  return NEW;
end;
$$;

create trigger on_comment_insert
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- トリガー: フォロー時に通知
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  perform public.create_notification(NEW.following_id, NEW.follower_id, 'follow', null);
  return NEW;
end;
$$;

create trigger on_follow_insert
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- トリガー: リミックス時に通知
create or replace function public.notify_on_remix()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_parent_author_id uuid;
begin
  if NEW.parent_id is not null then
    select author_id into v_parent_author_id
    from public.projects where id = NEW.parent_id;

    perform public.create_notification(v_parent_author_id, NEW.author_id, 'remix', NEW.id);
  end if;
  return NEW;
end;
$$;

create trigger on_project_remix_insert
  after insert on public.projects
  for each row execute function public.notify_on_remix();

-- 全通知を既読にするRPC
create or replace function public.mark_notifications_read()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.notifications
  set read = true
  where recipient_id = auth.uid() and read = false;
end;
$$;

-- 未読通知数を取得
create or replace function public.get_unread_notification_count()
returns bigint
language sql
security invoker set search_path = ''
as $$
  select count(*) from public.notifications
  where recipient_id = auth.uid() and read = false;
$$;
