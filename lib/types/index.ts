export type Named = { name: string; icon: string | null };
export type CharacterRow = {
  id: string; name: string; display_name: string; slug: string; grade: number; type: string | null;
  role: string | null; rarity: number; icon: string | null; character_image: string | null; element_id: string | null;
  element_name: string | null; element_slug: string | null;
  atk: number | null; hp: number | null; def: number | null; atk_speed: number | null; move_speed: number | null;
  spl: number | null; m_def: number | null; m_hp: number | null; m_dps: number | null; normal_cd: number | null;
  tag_slugs: string[]; skill_types: string[]; skills: Named[]; abilities: Named[];
};
export type Option = { id: string; name: string; slug?: string };
export type Profile = { id: string; username: string | null; role: "user" | "admin" | "owner" };
