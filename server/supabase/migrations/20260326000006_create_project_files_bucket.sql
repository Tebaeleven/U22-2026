-- プロジェクトファイル用ストレージバケット
-- 構造: {user_id}/{project_id}/project.json, thumbnail.png, assets/...
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true);

-- 誰でも閲覧可能（公開プロジェクトのサムネイル等を表示するため）
create policy "project_files_select_all" on storage.objects
  for select using (bucket_id = 'project-files');

-- 認証済みユーザーが自分のフォルダにのみアップロード可能
create policy "project_files_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'project-files'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 本人のファイルのみ更新可能
create policy "project_files_update_own" on storage.objects
  for update using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 本人のファイルのみ削除可能
create policy "project_files_delete_own" on storage.objects
  for delete using (
    bucket_id = 'project-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
