-- comments テーブルにいいね数カラムを追加
alter table public.comments
  add column love_count integer not null default 0;

-- カウンター自動同期トリガー
create or replace function public.update_comment_love_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    update public.comments set love_count = love_count + 1 where id = NEW.comment_id;
  elsif TG_OP = 'DELETE' then
    update public.comments set love_count = love_count - 1 where id = OLD.comment_id;
  end if;
  return null;
end;
$$;

create trigger update_comment_love_count_trigger
  after insert or delete on public.comment_loves
  for each row execute function public.update_comment_love_count();
