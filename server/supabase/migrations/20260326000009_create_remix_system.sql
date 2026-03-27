-- プロジェクトにリミックス元の参照を追加
-- ON DELETE SET NULL: 元プロジェクトが削除されてもリミックスは残る
alter table public.projects
  add column parent_id bigint references public.projects(id) on delete set null;

-- リミックスツリー検索用インデックス
create index idx_projects_parent_id on public.projects(parent_id)
  where parent_id is not null;

-- リミックス作成用RPC
create or replace function public.create_remix(p_parent_id bigint, p_title text)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_id bigint;
  v_parent_exists boolean;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 親プロジェクトの存在確認（公開プロジェクトのみリミックス可能）
  select exists(
    select 1 from public.projects
    where id = p_parent_id and shared = true
  ) into v_parent_exists;

  if not v_parent_exists then
    raise exception 'Parent project not found or not shared';
  end if;

  -- 新プロジェクトを作成
  insert into public.projects (author_id, title, parent_id)
  values (v_user_id, p_title, p_parent_id)
  returning id into v_new_id;

  -- 親プロジェクトのリミックスカウンターをインクリメント
  update public.projects
  set remixes = remixes + 1
  where id = p_parent_id;

  return v_new_id;
end;
$$;

-- リミックスツリーの取得（ある作品の公開リミックス一覧）
create or replace function public.get_remix_tree(p_project_id bigint)
returns setof public.projects
language sql
security invoker set search_path = ''
as $$
  select * from public.projects
  where parent_id = p_project_id and shared = true
  order by created_at desc;
$$;
