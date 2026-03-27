-- パフォーマンス用部分インデックス
create index idx_projects_shared_loves on public.projects(loves desc) where shared = true;
create index idx_projects_shared_views on public.projects(views desc) where shared = true;
create index idx_projects_shared_created on public.projects(created_at desc) where shared = true;

-- トレンドプロジェクト（エンゲージメント × 新しさ）
create or replace function public.get_trending_projects(
  p_limit int default 20,
  p_offset int default 0
)
returns setof public.projects
language sql
security definer set search_path = ''
stable
as $$
  select *
  from public.projects
  where shared = true
  order by (
    (loves * 3 + views * 0.1 + remixes * 5)
    / (1.0 + extract(epoch from (now() - created_at)) / 86400.0)
  ) desc
  limit p_limit offset p_offset;
$$;

-- いいね数ランキング
create or replace function public.get_most_loved_projects(
  p_limit int default 20,
  p_offset int default 0
)
returns setof public.projects
language sql
security definer set search_path = ''
stable
as $$
  select * from public.projects
  where shared = true
  order by loves desc, created_at desc
  limit p_limit offset p_offset;
$$;

-- 閲覧数ランキング
create or replace function public.get_most_viewed_projects(
  p_limit int default 20,
  p_offset int default 0
)
returns setof public.projects
language sql
security definer set search_path = ''
stable
as $$
  select * from public.projects
  where shared = true
  order by views desc, created_at desc
  limit p_limit offset p_offset;
$$;

-- 最新プロジェクト
create or replace function public.get_recent_projects(
  p_limit int default 20,
  p_offset int default 0
)
returns setof public.projects
language sql
security definer set search_path = ''
stable
as $$
  select * from public.projects
  where shared = true
  order by created_at desc
  limit p_limit offset p_offset;
$$;
