import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterRow, Option } from "@/lib/types";

export const PAGE_SIZE = 20;
export const SORT_KEYS = ["name", "grade", "atk", "hp", "def", "move_speed", "atk_speed", "m_dps", "m_def", "m_hp"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type ListParams = {
  page: number; sort: SortKey; dir: "asc" | "desc"; q?: string;
  grade?: string; type?: string; element?: string; role?: string; rarity?: string; tag?: string; skill_type?: string;
};

export function parseParams(sp: Record<string, string | string[] | undefined>): ListParams {
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined)) || undefined;
  const sort = SORT_KEYS.includes(one("sort") as SortKey) ? (one("sort") as SortKey) : "grade";
  return {
    page: Math.max(1, parseInt(one("page") || "1", 10) || 1), sort, dir: one("dir") === "asc" ? "asc" : "desc",
    q: one("q"), grade: one("grade"), type: one("type"), element: one("element"), role: one("role"),
    rarity: one("rarity"), tag: one("tag"), skill_type: one("skill_type"),
  };
}

// Escape characters that have meaning inside PostgREST ilike filters.
const clean = (s: string) => s.replace(/[%,()*\\]/g, " ").trim();

export async function listCharacters(supabase: SupabaseClient, p: ListParams) {
  let q = supabase.from("character_list_view").select("*", { count: "exact" });
  if (p.q && clean(p.q)) q = q.ilike("display_name", `%${clean(p.q)}%`);
  if (p.grade) q = q.eq("grade", Number(p.grade));
  if (p.rarity) q = q.eq("rarity", Number(p.rarity));
  if (p.type) q = q.eq("type", p.type);
  if (p.role) q = q.eq("role", p.role);
  if (p.element) q = q.eq("element_slug", p.element);
  if (p.tag) q = q.contains("tag_slugs", [p.tag]);
  if (p.skill_type) q = q.contains("skill_types", [p.skill_type]);
  const from = (p.page - 1) * PAGE_SIZE;
  const { data, count, error } = await q
    .order(p.sort, { ascending: p.dir === "asc", nullsFirst: false })
    .order("name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  if (error) console.error(error.message);
  return { rows: (data ?? []) as CharacterRow[], total: count ?? 0 };
}

export async function getFilterOptions(supabase: SupabaseClient) {
  const [el, tg] = await Promise.all([
    supabase.from("elements").select("id,name,slug").order("name"),
    supabase.from("tags").select("id,name,slug").order("name"),
  ]);
  return { elements: (el.data ?? []) as Option[], tags: (tg.data ?? []) as Option[] };
}

export async function getCharacterBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase
    .from("characters")
    .select(`*, element:elements(*),
      character_stats(*),
      character_skills(skill_order, is_locked, unlock_note, skill:skills(*, skill_effects(*))),
      character_abilities(is_locked, unlock_note, ability:abilities(*, ability_effects(*))),
      evolution_materials(quantity, item:items(*)),
      character_tags(tag:tags(*)),
      character_stages(drop_rate, drop_type, stage:stages(*))`)
    .eq("slug", slug).maybeSingle();
  if (!data) return null;
  const { data: mem } = await supabase.from("evolution_chain_members").select("chain_id").eq("character_id", data.id).limit(1).maybeSingle();
  let chain: { name: string; members: any[] } | null = null;
  if (mem) {
    const [{ data: c }, { data: members }] = await Promise.all([
      supabase.from("evolution_chains").select("name").eq("id", mem.chain_id).single(),
      supabase.from("evolution_chain_members").select("order_index, character:characters(id,display_name,slug,grade,character_image,icon)")
        .eq("chain_id", mem.chain_id).order("order_index"),
    ]);
    chain = { name: c?.name ?? "", members: members ?? [] };
  }
  return { ...data, chain } as any;
}

export async function globalSearch(supabase: SupabaseClient, term: string) {
  const t = `%${clean(term)}%`;
  const [c, s, a, st, tg] = await Promise.all([
    supabase.from("characters").select("display_name,slug,grade").ilike("display_name", t).limit(10),
    supabase.from("skills").select("name,slug,skill_type").ilike("name", t).limit(10),
    supabase.from("abilities").select("id,name").ilike("name", t).limit(10),
    supabase.from("stages").select("name,slug,stage_type").ilike("name", t).limit(10),
    supabase.from("tags").select("name,slug").ilike("name", t).limit(10),
  ]);
  return { characters: c.data ?? [], skills: s.data ?? [], abilities: a.data ?? [], stages: st.data ?? [], tags: tg.data ?? [] };
}
