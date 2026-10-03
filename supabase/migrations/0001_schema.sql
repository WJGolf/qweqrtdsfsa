-- Game Database schema (Step 1)
create extension if not exists pg_trgm;

create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- profiles (linked to Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  role text not null default 'user' check (role in ('user','admin','owner')),
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username) values (new.id, split_part(new.email,'@',1));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','owner'));
$$;

-- lookups
create table elements (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique, icon text
);
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique
);
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique
);

-- characters
create table characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text not null,
  slug text not null unique,
  grade int not null default 1,
  type text,                       -- STR / INT ...
  element_id uuid references elements(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  role text,                       -- DPS / Tank / Support / Healer
  rarity int not null default 1,
  description text,
  character_image text,            -- storage path or URL (never base64)
  icon text,
  release_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_characters_updated before update on characters
  for each row execute function set_updated_at();

create table character_stats (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  label text not null default 'Level 1',   -- Level 1 / Level 100 / Awakened / Evolution
  level int not null default 1,
  max_level int,
  atk numeric, physical_atk numeric, magical_atk numeric,
  hp numeric, def numeric, physical_def numeric, magical_def numeric,
  atk_speed numeric, move_speed numeric, attack_distance numeric, splash_radius numeric,
  critical_rate numeric, critical_damage numeric,
  evade_rate numeric, hit_rate numeric,
  skill_use_rate numeric, skill_evade_rate numeric, skill_hit_rate numeric, skill_resistance numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (character_id, label)
);
create trigger trg_stats_updated before update on character_stats
  for each row execute function set_updated_at();

-- skills
create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  skill_type text not null default 'Active' check (skill_type in ('Active','Passive','Ultimate','Special')),
  target_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_skills_updated before update on skills
  for each row execute function set_updated_at();

create table skill_effects (
  id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(id) on delete cascade,
  effect_type text not null,  -- Damage, Heal, Shield, Buff, Debuff, Stun, Slow, Silence, ...
  area numeric, factor numeric, duration numeric, probability numeric, cooldown numeric,
  damage numeric, heal numeric, shield numeric,
  formula text, description text
);

create table character_skills (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  skill_order int not null default 1,
  unique (character_id, skill_id)
);

-- abilities
create table abilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_abilities_updated before update on abilities
  for each row execute function set_updated_at();

create table ability_effects (
  id uuid primary key default gen_random_uuid(),
  ability_id uuid not null references abilities(id) on delete cascade,
  effect text, activate_on text, condition text, probability numeric
);

create table character_abilities (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  ability_id uuid not null references abilities(id) on delete cascade,
  unique (character_id, ability_id)
);

-- tags
create table character_tags (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  unique (character_id, tag_id)
);

-- stages
create table stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  stage_type text not null default 'Normal' check (stage_type in ('Normal','Hard','Special','Event')),
  difficulty int,
  created_at timestamptz not null default now()
);
create table stage_rewards (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references stages(id) on delete cascade,
  reward_name text not null, quantity int, drop_rate numeric
);
create table character_stages (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  drop_rate numeric, drop_type text,
  unique (character_id, stage_id)
);

-- evolution
create table evolution_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text
);
create table evolution_chain_members (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references evolution_chains(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  order_index int not null,
  unique (chain_id, character_id),
  unique (chain_id, order_index)
);

-- media
create table media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null, path text not null, alt text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

-- user data
create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, character_id)
);
create table search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);

-- indexes
create index idx_characters_name on characters (name);
create index idx_characters_name_trgm on characters using gin (name gin_trgm_ops);
create index idx_characters_display_trgm on characters using gin (display_name gin_trgm_ops);
create index idx_characters_slug on characters (slug);
create index idx_characters_grade on characters (grade);
create index idx_characters_type on characters (type);
create index idx_characters_element on characters (element_id);
create index idx_characters_role on characters (role);
create index idx_characters_rarity on characters (rarity);
create index idx_stats_character on character_stats (character_id);
create index idx_cskills_character on character_skills (character_id);
create index idx_cabilities_character on character_abilities (character_id);
create index idx_ctags_character on character_tags (character_id);
create index idx_ctags_tag on character_tags (tag_id);
create index idx_cstages_character on character_stages (character_id);
create index idx_skills_name_trgm on skills using gin (name gin_trgm_ops);
create index idx_abilities_name_trgm on abilities using gin (name gin_trgm_ops);
create index idx_stages_name_trgm on stages using gin (name gin_trgm_ops);
create index idx_favorites_user on favorites (user_id);
create index idx_search_history_user on search_history (user_id, created_at desc);
