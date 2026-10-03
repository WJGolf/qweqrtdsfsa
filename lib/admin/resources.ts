// Config-driven CRUD for the simple tables. Characters have their own form.
export type Field =
  | { key: string; label: string; type: "text" | "textarea" | "number"; required?: boolean }
  | { key: string; label: string; type: "select"; options: string[]; required?: boolean }
  | { key: string; label: string; type: "ref"; table: string; labelCol: string; required?: boolean }
  | { key: string; label: string; type: "image"; bucket: string }
  | { key: string; label: string; type: "checkbox" };

export type Resource = { table: string; title: string; slugFrom?: string; fields: Field[]; listCols: string[]; orderBy: string };

const SKILL_TYPES = ["Active", "Passive", "Ultimate", "Special"];
const EFFECTS = ["Damage", "Heal", "Shield", "Buff", "Debuff", "Stun", "Slow", "Silence", "Invincible", "ATK Up", "DEF Up", "HP Up", "Speed Up", "Remove Buff", "Remove Debuff", "Critical"];
const num = (key: string, label: string): Field => ({ key, label, type: "number" });

export const RESOURCES: Record<string, Resource> = {
  skills: { table: "skills", title: "Skills", slugFrom: "name", orderBy: "name", listCols: ["name", "skill_type", "probability", "cooldown"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "skill_type", label: "Skill type", type: "select", options: SKILL_TYPES, required: true },
    { key: "target_type", label: "Target type", type: "text" },
    { key: "probability", label: "Probability (e.g. 30%)", type: "text" }, { key: "cooldown", label: "CD time (e.g. 12s)", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "icon", label: "Icon", type: "image", bucket: "skills" }] },
  skill_effects: { table: "skill_effects", title: "Skill effects", orderBy: "sort_order", listCols: ["effect_type", "area", "factor", "duration"], fields: [
    { key: "skill_id", label: "Skill", type: "ref", table: "skills", labelCol: "name", required: true },
    { key: "effect_type", label: "Effect (e.g. Shield (Limited HP))", type: "text" },
    { key: "area", label: "Area (e.g. 350pt)", type: "text" }, { key: "factor", label: "Factor (e.g. 500%, ATK*4,100%)", type: "text" },
    { key: "duration", label: "Eff. Dur. (e.g. 10s)", type: "text" }, num("sort_order", "Row order"),
    { key: "description", label: "Note", type: "textarea" }] },
  abilities: { table: "abilities", title: "Abilities", orderBy: "name", listCols: ["name", "description"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "description", label: "Description", type: "textarea" },
    { key: "is_group", label: "Group ability (members = characters linked to it)", type: "checkbox" },
    { key: "group_buff", label: "Group buff (e.g. @2: ×110% / @3: ×115%)", type: "textarea" },
    { key: "group_note", label: "Group note", type: "textarea" },
    { key: "icon", label: "Icon", type: "image", bucket: "abilities" }] },
  ability_effects: { table: "ability_effects", title: "Ability effects", orderBy: "effect", listCols: ["effect", "activate_on", "condition", "probability"], fields: [
    { key: "ability_id", label: "Ability", type: "ref", table: "abilities", labelCol: "name", required: true },
    { key: "effect", label: "Effect", type: "text" }, { key: "activate_on", label: "Activate on", type: "text" },
    { key: "condition", label: "Condition", type: "text" }, num("probability", "Probability %")] },
  items: { table: "items", title: "Items (materials)", slugFrom: "name", orderBy: "name", listCols: ["name"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "description", label: "Description", type: "textarea" },
    { key: "icon", label: "Icon", type: "image", bucket: "icons" }] },
  stages: { table: "stages", title: "Stages", slugFrom: "name", orderBy: "name", listCols: ["name", "stage_type", "difficulty"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "stage_type", label: "Stage type", type: "select", options: ["Normal", "Hard", "Special", "Event"], required: true },
    num("difficulty", "Difficulty"), { key: "description", label: "Description", type: "textarea" }, { key: "image", label: "Image", type: "image", bucket: "stages" }] },
  stage_rewards: { table: "stage_rewards", title: "Stage rewards", orderBy: "reward_name", listCols: ["reward_name", "quantity", "drop_rate"], fields: [
    { key: "stage_id", label: "Stage", type: "ref", table: "stages", labelCol: "name", required: true },
    { key: "reward_name", label: "Reward", type: "text", required: true }, num("quantity", "Quantity"), num("drop_rate", "Drop rate %")] },
  tags: { table: "tags", title: "Tags", slugFrom: "name", orderBy: "name", listCols: ["name", "slug"], fields: [{ key: "name", label: "Name", type: "text", required: true }] },
  elements: { table: "elements", title: "Elements", slugFrom: "name", orderBy: "name", listCols: ["name", "slug"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "icon", label: "Icon", type: "image", bucket: "icons" }] },
  categories: { table: "categories", title: "Categories", slugFrom: "name", orderBy: "name", listCols: ["name", "slug"], fields: [{ key: "name", label: "Name", type: "text", required: true }] },
  evolution_chains: { table: "evolution_chains", title: "Evolution chains", orderBy: "name", listCols: ["name", "description"], fields: [
    { key: "name", label: "Name", type: "text", required: true }, { key: "description", label: "Description", type: "textarea" }] },
  evolution_chain_members: { table: "evolution_chain_members", title: "Evolution members", orderBy: "order_index", listCols: ["order_index"], fields: [
    { key: "chain_id", label: "Chain", type: "ref", table: "evolution_chains", labelCol: "name", required: true },
    { key: "character_id", label: "Character", type: "ref", table: "characters", labelCol: "display_name", required: true },
    { key: "order_index", label: "Order (1 = first form)", type: "number", required: true }] },
  media: { table: "media", title: "Media", orderBy: "created_at", listCols: ["bucket", "path"], fields: [
    { key: "path", label: "Upload to icons bucket", type: "image", bucket: "icons" }] },
};
export const ADMIN_LINKS = [["characters", "Characters"], ...Object.entries(RESOURCES).map(([k, r]) => [k, r.title])];
