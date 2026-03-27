-- サムネイル用ストレージバケット
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true);

-- サムネイルは誰でも閲覧可能
create policy "thumbnails_select_all" on storage.objects
  for select using (bucket_id = 'thumbnails');

-- 認証済みユーザーのみアップロード可能
create policy "thumbnails_insert_auth" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and auth.role() = 'authenticated');

-- 本人がアップロードしたファイルのみ更新・削除可能
create policy "thumbnails_update_own" on storage.objects
  for update using (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "thumbnails_delete_own" on storage.objects
  for delete using (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);
