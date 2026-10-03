-- Extra fields for Line Rangers-style detail pages

-- Character-level details (display text kept as text because the game shows e.g. "Fast (2.17s + 0.00s)")
alter table characters
  add column if not exists leonard_point int,
  add column if not exists element_max int,
  add column if not exists mineral int,
  add column if not exists lab_extraction text,
  add column if not exists norm_cd numeric,
  add column if not exists atk_speed_text text,
  add column if not exists move_speed_text text,
  add column if not exists skill_use_text text;

alter table character_stats add column if not exists atk_per_sec numeric;

-- Skills: probability and cooldown belong to the whole skill; effect values are free text ("350pt", "ATK*4,100%", "-")
alter table skills
  add column if not exists probability text,
  add column if not exists cooldown text;

alter table skill_effects
  alter column area type text using area::text,
  alter column factor type text using factor::text,
  alter column duration type text using duration::text,
  add column if not exists sort_order int not null default 0;

-- Abilities: group buff + group flag (members = characters linked to the same ability)
alter table abilities
  add column if not exists is_group boolean not null default false,
  add column if not exists group_buff text,
  add column if not exists group_note text;

-- Locked / upgraded skills and abilities (shown faded on the detail page)
alter table character_skills
  add column if not exists is_locked boolean not null default false,
  add column if not exists unlock_note text;
alter table character_abilities
  add column if not exists is_locked boolean not null default false,
  add column if not exists unlock_note text;

-- Evolution materials
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique,
  icon text, description text
);
create table if not exists evolution_materials (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  quantity int not null default 1,
  unique (character_id, item_id)
);
create index if not exists idx_evo_materials_character on evolution_materials (character_id);
create index if not exists idx_skill_effects_skill on skill_effects (skill_id, sort_order);

do $$
declare t text;
begin
  foreach t in array array['items','evolution_materials'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select using (true)', t);
    execute format('create policy "admin insert" on %I for insert with check (is_admin())', t);
    execute format('create policy "admin update" on %I for update using (is_admin()) with check (is_admin())', t);
    execute format('create policy "admin delete" on %I for delete using (is_admin())', t);
  end loop;
end $$;
