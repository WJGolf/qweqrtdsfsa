-- Flat, sortable list view for /characters (server-side filter/sort/pagination)
create or replace view character_list_view with (security_invoker = true) as
select
  c.id, c.name, c.display_name, c.slug, c.grade, c.type, c.role, c.rarity,
  c.icon, c.character_image, c.is_active, c.element_id,
  e.name as element_name, e.slug as element_slug,
  s.atk, s.hp, s.def, s.atk_speed, s.move_speed, s.splash_radius as spl,
  s.magical_def as m_def, s.hp as m_hp,
  round((s.atk * s.atk_speed)::numeric, 1) as m_dps,
  case when s.atk_speed > 0 then round((1 / s.atk_speed)::numeric, 2) end as normal_cd,
  coalesce((select array_agg(t.slug) from character_tags ct join tags t on t.id = ct.tag_id where ct.character_id = c.id), '{}') as tag_slugs,
  coalesce((select array_agg(distinct sk.skill_type) from character_skills cs join skills sk on sk.id = cs.skill_id where cs.character_id = c.id), '{}') as skill_types,
  coalesce((select jsonb_agg(jsonb_build_object('name', sk.name, 'icon', sk.icon) order by cs.skill_order)
            from character_skills cs join skills sk on sk.id = cs.skill_id where cs.character_id = c.id), '[]'::jsonb) as skills,
  coalesce((select jsonb_agg(jsonb_build_object('name', a.name, 'icon', a.icon))
            from character_abilities ca join abilities a on a.id = ca.ability_id where ca.character_id = c.id), '[]'::jsonb) as abilities
from characters c
left join elements e on e.id = c.element_id
left join lateral (select * from character_stats x where x.character_id = c.id order by x.level asc limit 1) s on true
where c.is_active;

create index if not exists idx_ctags_char_tag on character_tags (character_id, tag_id);
