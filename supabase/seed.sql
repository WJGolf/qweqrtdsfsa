-- Seed data (Step 4) — test data only; real data lives in Supabase and is managed from /admin
-- Safe to re-run: uses ON CONFLICT on unique slugs/names.

insert into elements (name, slug) values
  ('Fire','fire'),('Water','water'),('Earth','earth'),
  ('Light','light'),('Dark','dark'),('Wind','wind')
on conflict (slug) do nothing;

insert into categories (name, slug) values
  ('Kaiju No. 8','kaiju-no-8'),('Original','original')
on conflict (slug) do nothing;

insert into tags (name, slug) values
  ('Fire','fire'),('Water','water'),('Light','light'),('Dark','dark'),('Earth','earth'),
  ('STR','str'),('INT','int'),
  ('DPS','dps'),('Tank','tank'),('Support','support'),('Healer','healer'),
  ('Melee','melee'),('Ranged','ranged'),('PvE','pve'),('PvP','pvp')
on conflict (slug) do nothing;

-- Characters
insert into characters (name, display_name, slug, grade, type, element_id, category_id, role, rarity, description, release_date)
select v.name, v.display_name, v.slug, v.grade, v.type,
       (select id from elements where slug = v.el),
       (select id from categories where slug = v.cat),
       v.role, v.rarity, v.descr, v.rel::date
from (values
  ('kafka','Kafka','kafka',3,'STR','earth','kaiju-no-8','DPS',3,'A cleanup worker with a dream.','2026-01-10'),
  ('first_division_kafka','First Division Kafka','first-division-kafka',5,'STR','earth','kaiju-no-8','DPS',5,'Kafka after joining the Defense Force.','2026-02-10'),
  ('third_division_kafka','Third Division Kafka','third-division-kafka',7,'STR','water','kaiju-no-8','DPS',7,'Kafka fighting on the front line.','2026-03-10'),
  ('kaiju_no_8_kafka','Kaiju No. 8 Kafka','kaiju-no-8-kafka',9,'STR','water','kaiju-no-8','DPS',9,'Kafka in his full kaiju form.','2026-04-10'),
  ('flame_knight','Flame Knight','flame-knight',6,'STR','fire','original','Tank',6,'Heavy knight wrapped in living fire.','2026-05-01'),
  ('frost_mage','Frost Mage','frost-mage',7,'INT','water','original','DPS',7,'Freezes whole lanes with a single spell.','2026-05-15'),
  ('light_priestess','Light Priestess','light-priestess',6,'INT','light','original','Healer',6,'Heals allies and cleanses debuffs.','2026-06-01'),
  ('shadow_assassin','Shadow Assassin','shadow-assassin',8,'STR','dark','original','DPS',8,'Strikes from the dark with high crit.','2026-06-20'),
  ('wind_archer','Wind Archer','wind-archer',5,'INT','wind','original','DPS',5,'Long-range archer with fast attacks.','2026-07-05'),
  ('earth_guardian','Earth Guardian','earth-guardian',4,'STR','earth','original','Tank',4,'Stone guardian that shields the team.','2026-07-25')
) as v(name,display_name,slug,grade,type,el,cat,role,rarity,descr,rel)
on conflict (slug) do nothing;

-- Stats (Level 1 for everyone, Level 100 for the top Kafka)
insert into character_stats (character_id, label, level, max_level, atk, physical_atk, magical_atk, hp, def, physical_def, magical_def,
  atk_speed, move_speed, attack_distance, splash_radius, critical_rate, critical_damage, evade_rate, hit_rate,
  skill_use_rate, skill_evade_rate, skill_hit_rate, skill_resistance)
select c.id, v.label, v.level, 100, v.atk, v.atk, v.atk*0.4, v.hp, v.def, v.def, v.def*0.8,
       v.aspd, v.mspd, v.dist, v.splash, v.crit, 150, 5, 100, 20, 5, 100, 10
from (values
  ('kafka','Level 1',1,120,1500,60,1.0,3.0,1.5,0,5),
  ('first-division-kafka','Level 1',1,260,3200,120,1.1,3.2,1.5,0,6),
  ('third-division-kafka','Level 1',1,480,5600,210,1.2,3.4,1.5,1,8),
  ('kaiju-no-8-kafka','Level 1',1,820,9800,340,1.3,3.6,2.0,1.5,10),
  ('kaiju-no-8-kafka','Level 100',100,4100,48000,1500,1.3,3.6,2.0,1.5,25),
  ('flame-knight','Level 1',1,300,8800,420,0.8,2.6,1.5,1,5),
  ('frost-mage','Level 1',1,540,4800,150,0.9,2.8,5.0,2,8),
  ('light-priestess','Level 1',1,200,5200,160,0.9,2.8,4.5,2,3),
  ('shadow-assassin','Level 1',1,700,5000,180,1.6,4.2,1.2,0,30),
  ('wind-archer','Level 1',1,400,4000,130,1.5,3.5,6.0,0,12),
  ('earth-guardian','Level 1',1,180,7500,380,0.7,2.4,1.5,1,4)
) as v(slug,label,level,atk,hp,def,aspd,mspd,dist,splash,crit)
join characters c on c.slug = v.slug
on conflict (character_id, label) do nothing;

-- Skills
insert into skills (name, slug, description, skill_type, target_type) values
  ('Cleanup Strike','cleanup-strike','A basic heavy punch.','Active','Single'),
  ('Defense Force Slash','defense-force-slash','Slash through nearby enemies.','Active','Area'),
  ('Front Line Charge','front-line-charge','Charge forward and stun.','Active','Area'),
  ('Kaiju Fist','kaiju-fist','Massive punch with splash damage.','Active','Area'),
  ('Kaiju Roar','kaiju-roar','Ultimate roar that boosts ATK.','Ultimate','Self'),
  ('Blazing Wall','blazing-wall','Fire wall that burns enemies.','Active','Area'),
  ('Glacier Fall','glacier-fall','Ice storm that slows enemies.','Ultimate','Area'),
  ('Holy Light','holy-light','Heal all allies.','Active','Allies'),
  ('Shadow Step','shadow-step','Teleport behind the target.','Special','Single'),
  ('Gale Volley','gale-volley','Rain of arrows.','Active','Area'),
  ('Stone Aegis','stone-aegis','Shield all allies.','Passive','Allies')
on conflict (slug) do nothing;

insert into skill_effects (skill_id, effect_type, area, factor, duration, probability, cooldown, damage, heal, shield, formula, description)
select s.id, v.etype, v.area, v.factor, v.dur, v.prob, v.cd, v.dmg, v.heal, v.shield, v.formula, v.descr
from (values
  ('cleanup-strike','Damage',1.5,1.2,0,100,4,1.2,0,0,'ATK x 1.2','Deals 120% ATK damage'),
  ('defense-force-slash','Damage',3.0,1.6,0,100,5,1.6,0,0,'ATK x 1.6','Deals 160% ATK damage'),
  ('front-line-charge','Stun',3.0,1.8,2,60,6,1.8,0,0,'ATK x 1.8','Damage and 60% chance to stun for 2s'),
  ('kaiju-fist','Damage',4.0,2.5,0,100,6,2.5,0,0,'ATK x 2.5','Deals 250% ATK splash damage'),
  ('kaiju-roar','ATK Up',0,0.5,10,100,20,0,0,0,'ATK x 0.5','Raises ATK by 50% for 10s'),
  ('blazing-wall','Damage',4.0,2.0,3,100,8,2.0,0,0,'MATK x 2.0','Burns enemies for 3s'),
  ('glacier-fall','Slow',6.0,3.0,5,100,15,3.0,0,0,'MATK x 3.0','Damage and slow for 5s'),
  ('holy-light','Heal',0,1.5,0,100,7,0,1.5,0,'MATK x 1.5','Heals all allies'),
  ('shadow-step','Critical',1.2,2.2,0,100,5,2.2,0,0,'ATK x 2.2','Guaranteed critical hit from behind'),
  ('gale-volley','Damage',5.0,1.4,0,100,5,1.4,0,0,'ATK x 1.4','Fires 5 arrows'),
  ('stone-aegis','Shield',0,0.3,8,100,12,0,0,0.3,'HP x 0.3','Shield equal to 30% max HP')
) as v(slug,etype,area,factor,dur,prob,cd,dmg,heal,shield,formula,descr)
join skills s on s.slug = v.slug;

insert into character_skills (character_id, skill_id, skill_order)
select c.id, s.id, v.ord
from (values
  ('kafka','cleanup-strike',1),
  ('first-division-kafka','defense-force-slash',1),
  ('third-division-kafka','front-line-charge',1),
  ('kaiju-no-8-kafka','kaiju-fist',1),
  ('kaiju-no-8-kafka','kaiju-roar',2),
  ('flame-knight','blazing-wall',1),
  ('frost-mage','glacier-fall',1),
  ('light-priestess','holy-light',1),
  ('shadow-assassin','shadow-step',1),
  ('wind-archer','gale-volley',1),
  ('earth-guardian','stone-aegis',1)
) as v(cslug,sslug,ord)
join characters c on c.slug = v.cslug
join skills s on s.slug = v.sslug
on conflict (character_id, skill_id) do nothing;

-- Abilities
insert into abilities (name, description)
select v.name, v.descr
from (values
  ('Group: Kaiju No. 8','Member of the Kaiju No. 8 group.'),
  ('Fire Resist','Reduces fire damage taken.'),
  ('Holy Aura','Allies recover HP over time.')
) as v(name,descr)
where not exists (select 1 from abilities a where a.name = v.name);

insert into ability_effects (ability_id, effect, activate_on, condition, probability)
select a.id, v.effect, v.act, v.cond, v.prob
from (values
  ('Group: Kaiju No. 8','+0%','Any Game Type','None',100),
  ('Fire Resist','Fire DMG taken -20%','Any Game Type','None',100),
  ('Holy Aura','Heal 2% HP / sec','PvE','Ally HP < 50%',100)
) as v(aname,effect,act,cond,prob)
join abilities a on a.name = v.aname
where not exists (select 1 from ability_effects e where e.ability_id = a.id);

insert into character_abilities (character_id, ability_id)
select c.id, a.id
from (values
  ('kafka','Group: Kaiju No. 8'),
  ('first-division-kafka','Group: Kaiju No. 8'),
  ('third-division-kafka','Group: Kaiju No. 8'),
  ('kaiju-no-8-kafka','Group: Kaiju No. 8'),
  ('flame-knight','Fire Resist'),
  ('light-priestess','Holy Aura')
) as v(cslug,aname)
join characters c on c.slug = v.cslug
join abilities a on a.name = v.aname
on conflict (character_id, ability_id) do nothing;

-- Tags
insert into character_tags (character_id, tag_id)
select c.id, t.id
from (values
  ('kafka','earth'),('kafka','str'),('kafka','dps'),('kafka','melee'),
  ('first-division-kafka','earth'),('first-division-kafka','str'),('first-division-kafka','dps'),('first-division-kafka','melee'),
  ('third-division-kafka','water'),('third-division-kafka','str'),('third-division-kafka','dps'),('third-division-kafka','melee'),
  ('kaiju-no-8-kafka','water'),('kaiju-no-8-kafka','str'),('kaiju-no-8-kafka','dps'),('kaiju-no-8-kafka','melee'),('kaiju-no-8-kafka','pve'),
  ('flame-knight','fire'),('flame-knight','str'),('flame-knight','tank'),('flame-knight','melee'),
  ('frost-mage','water'),('frost-mage','int'),('frost-mage','dps'),('frost-mage','ranged'),('frost-mage','pvp'),
  ('light-priestess','light'),('light-priestess','int'),('light-priestess','healer'),('light-priestess','support'),
  ('shadow-assassin','dark'),('shadow-assassin','str'),('shadow-assassin','dps'),('shadow-assassin','melee'),('shadow-assassin','pvp'),
  ('wind-archer','int'),('wind-archer','dps'),('wind-archer','ranged'),
  ('earth-guardian','earth'),('earth-guardian','str'),('earth-guardian','tank'),('earth-guardian','melee')
) as v(cslug,tslug)
join characters c on c.slug = v.cslug
join tags t on t.slug = v.tslug
on conflict (character_id, tag_id) do nothing;

-- Evolution chain: Kafka -> First Division -> Third Division -> Kaiju No. 8
insert into evolution_chains (name, description)
select 'Kafka Line','Kafka evolution through the Defense Force'
where not exists (select 1 from evolution_chains where name = 'Kafka Line');

insert into evolution_chain_members (chain_id, character_id, order_index)
select ch.id, c.id, v.ord
from (values
  ('kafka',1),('first-division-kafka',2),('third-division-kafka',3),('kaiju-no-8-kafka',4)
) as v(cslug,ord)
join characters c on c.slug = v.cslug
cross join (select id from evolution_chains where name = 'Kafka Line') ch
on conflict do nothing;

-- Stages
insert into stages (name, slug, description, stage_type, difficulty) values
  ('Stage 1-1','stage-1-1','First normal stage.','Normal',1),
  ('Stage 5-3','stage-5-3','Mid-game normal stage.','Normal',3),
  ('Hard 3-2','hard-3-2','Hard difficulty stage.','Hard',6),
  ('Special: Kaiju Raid','special-kaiju-raid','Special raid stage.','Special',8),
  ('Event: Summer Festival','event-summer-festival','Limited-time event stage.','Event',5)
on conflict (slug) do nothing;

insert into stage_rewards (stage_id, reward_name, quantity, drop_rate)
select s.id, v.rname, v.qty, v.rate
from (values
  ('stage-1-1','Gold',500,100),
  ('hard-3-2','Evolution Stone',1,25),
  ('special-kaiju-raid','Kaiju Core',1,10)
) as v(sslug,rname,qty,rate)
join stages s on s.slug = v.sslug
where not exists (select 1 from stage_rewards r where r.stage_id = s.id and r.reward_name = v.rname);

insert into character_stages (character_id, stage_id, drop_rate, drop_type)
select c.id, s.id, v.rate, v.dtype
from (values
  ('kafka','stage-1-1',30,'Normal'),
  ('first-division-kafka','stage-5-3',15,'Normal'),
  ('third-division-kafka','hard-3-2',8,'Hard'),
  ('kaiju-no-8-kafka','special-kaiju-raid',2,'Special'),
  ('flame-knight','hard-3-2',10,'Hard'),
  ('wind-archer','stage-5-3',12,'Normal'),
  ('light-priestess','event-summer-festival',5,'Event')
) as v(cslug,sslug,rate,dtype)
join characters c on c.slug = v.cslug
join stages s on s.slug = v.sslug
on conflict (character_id, stage_id) do nothing;

-- Relationship check: every character should have stats; this should return 0 rows.
-- select slug from characters c where not exists (select 1 from character_stats s where s.character_id = c.id);
