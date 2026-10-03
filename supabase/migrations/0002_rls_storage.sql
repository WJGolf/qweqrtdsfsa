-- RLS (Step 2): public read, admin/owner write
do $$
declare t text;
begin
  foreach t in array array[
    'characters','character_stats','skills','skill_effects','character_skills',
    'abilities','ability_effects','character_abilities','elements','tags',
    'character_tags','categories','stages','stage_rewards','character_stages',
    'evolution_chains','evolution_chain_members','media'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "admin insert" on %I for insert with check (is_admin())', t);
    execute format('create policy "admin update" on %I for update using (is_admin()) with check (is_admin())', t);
    execute format('create policy "admin delete" on %I for delete using (is_admin())', t);
  end loop;
end $$;

-- profiles: read own (admins read all); only owner can change roles
alter table profiles enable row level security;
create policy "read own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "update own profile" on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy "owner manage roles" on profiles for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- favorites / search_history: own rows only
alter table favorites enable row level security;
create policy "own favorites select" on favorites for select using (user_id = auth.uid());
create policy "own favorites insert" on favorites for insert with check (user_id = auth.uid());
create policy "own favorites delete" on favorites for delete using (user_id = auth.uid());

alter table search_history enable row level security;
create policy "own history select" on search_history for select using (user_id = auth.uid());
create policy "own history insert" on search_history for insert with check (user_id = auth.uid());
create policy "own history delete" on search_history for delete using (user_id = auth.uid());

-- Storage (Step 3): public buckets, admin-only writes
insert into storage.buckets (id, name, public) values
  ('characters','characters',true), ('skills','skills',true),
  ('abilities','abilities',true), ('stages','stages',true), ('icons','icons',true)
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select
  using (bucket_id in ('characters','skills','abilities','stages','icons'));
create policy "admin upload images" on storage.objects for insert
  with check (bucket_id in ('characters','skills','abilities','stages','icons') and is_admin());
create policy "admin update images" on storage.objects for update
  using (bucket_id in ('characters','skills','abilities','stages','icons') and is_admin());
create policy "admin delete images" on storage.objects for delete
  using (bucket_id in ('characters','skills','abilities','stages','icons') and is_admin());
