-- スタジオプロジェクトに追加日時カラム
alter table public.studio_projects
  add column added_at timestamptz not null default now();

-- スタジオプロジェクト: キュレーターまたは自分の公開作品なら追加可能
create policy "studio_projects_insert_curator_or_own" on public.studio_projects
  for insert with check (
    exists (
      select 1 from public.studio_curators sc
      where sc.studio_id = studio_projects.studio_id and sc.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.projects p
      where p.id = studio_projects.project_id and p.author_id = auth.uid() and p.shared = true
    )
  );

-- スタジオプロジェクト: キュレーターまたは作品の作者なら削除可能
create policy "studio_projects_delete_curator_or_own" on public.studio_projects
  for delete using (
    exists (
      select 1 from public.studio_curators sc
      where sc.studio_id = studio_projects.studio_id and sc.user_id = auth.uid()
    )
    or
    exists (
      select 1 from public.projects p
      where p.id = studio_projects.project_id and p.author_id = auth.uid()
    )
  );

-- キュレーター追加: スタジオ作成者のみ
create policy "studio_curators_insert_owner" on public.studio_curators
  for insert with check (
    exists (
      select 1 from public.studios s
      where s.id = studio_curators.studio_id and s.created_by = auth.uid()
    )
  );

-- キュレーター削除: スタジオ作成者 or 本人が離脱
create policy "studio_curators_delete_owner_or_self" on public.studio_curators
  for delete using (
    exists (
      select 1 from public.studios s
      where s.id = studio_curators.studio_id and s.created_by = auth.uid()
    )
    or auth.uid() = user_id
  );
