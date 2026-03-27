-- updated_at 自動更新トリガー関数（汎用）
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- コメント数カウンターをプロジェクトに追加
alter table public.projects add column comment_count integer not null default 0;

-- 既存データの整合性を確保
update public.projects p
set comment_count = (
  select count(*) from public.comments c where c.project_id = p.id
);

-- コメント数の自動管理トリガー
create or replace function public.update_comment_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    update public.projects set comment_count = comment_count + 1 where id = NEW.project_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.projects set comment_count = greatest(comment_count - 1, 0) where id = OLD.project_id;
    return OLD;
  end if;
  return null;
end;
$$;

create trigger update_project_comment_count
  after insert or delete on public.comments
  for each row execute function public.update_comment_count();
