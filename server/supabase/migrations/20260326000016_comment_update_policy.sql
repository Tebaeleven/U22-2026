-- コメント編集ポリシー（本人のみ更新可能）
create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
