-- ビューカウントのatomicインクリメント
-- 重複排除はクライアント側でsessionStorageを使用
create or replace function public.increment_project_views(p_project_id bigint)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.projects
  set views = views + 1
  where id = p_project_id and shared = true;
end;
$$;
