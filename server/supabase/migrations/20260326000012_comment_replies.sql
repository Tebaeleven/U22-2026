-- コメントに返信先を追加（NULL = トップレベルコメント）
alter table public.comments
  add column parent_id uuid references public.comments(id) on delete cascade default null;

-- 返信の効率的な取得用インデックス
create index idx_comments_parent_id on public.comments(parent_id)
  where parent_id is not null;

-- プロジェクト別コメント取得用インデックス
create index idx_comments_project_id on public.comments(project_id);

-- 1段階のみ許可するトリガー（返信への返信は不可）
create or replace function public.check_comment_depth()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  v_parent_parent_id uuid;
begin
  if NEW.parent_id is not null then
    select c.parent_id into v_parent_parent_id
    from public.comments c where c.id = NEW.parent_id;

    if v_parent_parent_id is not null then
      raise exception 'Replies to replies are not allowed (one level deep only)';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger enforce_comment_depth
  before insert on public.comments
  for each row execute function public.check_comment_depth();
