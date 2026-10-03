"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RESOURCES } from "@/lib/admin/resources";
import { STAT_FIELDS } from "@/lib/utils/stats";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!p || !["admin", "owner"].includes(p.role)) redirect("/");
  return { supabase, userId: user.id };
}

const text = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);
const numeric = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : null);

// Uploads to Supabase Storage and records it in `media`. Returns the storage path (never base64).
async function upload(supabase: ReturnType<typeof createClient>, userId: string, bucket: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null;
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  await supabase.from("media").insert({ bucket, path, uploaded_by: userId });
  return path;
}

export async function saveRow(resource: string, id: string | null, formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const cfg = RESOURCES[resource];
  if (!cfg) throw new Error("Unknown resource");
  const row: Record<string, unknown> = {};
  for (const f of cfg.fields) {
    if (f.type === "number") row[f.key] = numeric(formData.get(f.key));
    else if (f.type === "checkbox") row[f.key] = formData.get(f.key) === "on";
    else if (f.type === "image") {
      const p = await upload(supabase, userId, f.bucket, formData.get(f.key));
      if (p) row[f.key] = p; // keep the old image when no new file is chosen
      if (resource === "media") row["bucket"] = f.bucket;
    } else row[f.key] = text(formData.get(f.key));
  }
  if (cfg.slugFrom && typeof row[cfg.slugFrom] === "string") row["slug"] = slugify(row[cfg.slugFrom] as string);
  if (resource === "media") { revalidatePath("/admin/media"); return; } // upload() already recorded the row
  const { error } = id ? await supabase.from(cfg.table).update(row).eq("id", id) : await supabase.from(cfg.table).insert(row);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${resource}`);
  revalidatePath("/characters");
  if (id) redirect(`/admin/${resource}`);
}

export async function deleteRow(resource: string, id: string) {
  const { supabase } = await requireAdmin();
  const cfg = RESOURCES[resource];
  if (!cfg) throw new Error("Unknown resource");
  const { error } = await supabase.from(cfg.table).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${resource}`);
}

export async function deleteCharacter(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("characters").delete().eq("id", id);
  revalidatePath("/admin/characters"); revalidatePath("/characters");
}

export async function saveCharacter(formData: FormData) {
  const { supabase, userId } = await requireAdmin();
  const id = text(formData.get("id"));
  const display_name = text(formData.get("display_name")) ?? text(formData.get("name"));
  if (!display_name) throw new Error("Name is required");
  const name = text(formData.get("name")) ?? slugify(display_name).replace(/-/g, "_");
  const row: Record<string, unknown> = {
    name, display_name, slug: text(formData.get("slug")) ?? slugify(display_name),
    grade: numeric(formData.get("grade")) ?? 1, rarity: numeric(formData.get("rarity")) ?? 1,
    type: text(formData.get("type")), role: text(formData.get("role")), description: text(formData.get("description")),
    element_id: text(formData.get("element_id")), category_id: text(formData.get("category_id")),
    release_date: text(formData.get("release_date")), is_active: formData.get("is_active") === "on",
    leonard_point: numeric(formData.get("leonard_point")), element_max: numeric(formData.get("element_max")),
    mineral: numeric(formData.get("mineral")), norm_cd: numeric(formData.get("norm_cd")),
    lab_extraction: text(formData.get("lab_extraction")), atk_speed_text: text(formData.get("atk_speed_text")),
    move_speed_text: text(formData.get("move_speed_text")), skill_use_text: text(formData.get("skill_use_text")),
  };
  const img = await upload(supabase, userId, "characters", formData.get("character_image"));
  const icon = await upload(supabase, userId, "characters", formData.get("icon"));
  if (img) row.character_image = img;
  if (icon) row.icon = icon;

  const res = id ? await supabase.from("characters").update(row).eq("id", id).select("id").single()
                 : await supabase.from("characters").insert(row).select("id").single();
  if (res.error) throw new Error(res.error.message);
  const cid = res.data.id as string;

  // Stats: up to 3 sets (e.g. Lv.1 / Lv.Max / Awakened), each saved as one character_stats row
  const labels: string[] = [];
  for (let i = 0; i < 3; i++) {
    const label = text(formData.get(`set_${i}_label`));
    if (!label) continue;
    labels.push(label);
    const stats: Record<string, unknown> = {
      character_id: cid, label, level: numeric(formData.get(`set_${i}_level`)) ?? i + 1, max_level: numeric(formData.get("max_level")),
    };
    for (const [k] of STAT_FIELDS) stats[k] = numeric(formData.get(`stat_${i}_${k}`));
    const s = await supabase.from("character_stats").upsert(stats, { onConflict: "character_id,label" });
    if (s.error) throw new Error(s.error.message);
  }
  if (labels.length) {
    await supabase.from("character_stats").delete().eq("character_id", cid)
      .not("label", "in", `(${labels.map((l) => `"${l.replace(/"/g, "")}"`).join(",")})`);
  }

  // Skills / abilities: ordered slots with an optional "locked" flag and note
  const slots = (prefix: string, count: number) => {
    const seen = new Set<string>();
    const out: { id: string; locked: boolean; note: string | null; order: number }[] = [];
    for (let i = 0; i < count; i++) {
      const v = text(formData.get(`${prefix}_${i}`));
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push({ id: v, locked: formData.get(`${prefix}_${i}_locked`) === "on", note: text(formData.get(`${prefix}_${i}_note`)), order: out.length + 1 });
    }
    return out;
  };
  await supabase.from("character_skills").delete().eq("character_id", cid);
  const sk = slots("skill", 4);
  if (sk.length) {
    const r = await supabase.from("character_skills").insert(sk.map((x) => ({ character_id: cid, skill_id: x.id, skill_order: x.order, is_locked: x.locked, unlock_note: x.note })));
    if (r.error) throw new Error(r.error.message);
  }
  await supabase.from("character_abilities").delete().eq("character_id", cid);
  const ab = slots("ability", 3);
  if (ab.length) {
    const r = await supabase.from("character_abilities").insert(ab.map((x) => ({ character_id: cid, ability_id: x.id, is_locked: x.locked, unlock_note: x.note })));
    if (r.error) throw new Error(r.error.message);
  }

  // Tags and stages: checkbox sets
  const links: [string, string, string[]][] = [
    ["character_tags", "tag_id", formData.getAll("tags") as string[]],
    ["character_stages", "stage_id", formData.getAll("stages") as string[]],
  ];
  for (const [table, col, ids] of links) {
    await supabase.from(table).delete().eq("character_id", cid);
    if (ids.length) {
      const r = await supabase.from(table).insert(ids.map((v) => ({ character_id: cid, [col]: v })));
      if (r.error) throw new Error(r.error.message);
    }
  }

  // Evolution materials (4 slots)
  await supabase.from("evolution_materials").delete().eq("character_id", cid);
  const mats = new Map<string, number>();
  for (let i = 0; i < 4; i++) {
    const item = text(formData.get(`mat_${i}_item`));
    if (item) mats.set(item, numeric(formData.get(`mat_${i}_qty`)) ?? 1);
  }
  if (mats.size) {
    const r = await supabase.from("evolution_materials").insert([...mats].map(([item_id, quantity]) => ({ character_id: cid, item_id, quantity })));
    if (r.error) throw new Error(r.error.message);
  }

  // Evolution chain position
  await supabase.from("evolution_chain_members").delete().eq("character_id", cid);
  const chain = text(formData.get("chain_id"));
  if (chain) {
    const r = await supabase.from("evolution_chain_members").insert({ chain_id: chain, character_id: cid, order_index: numeric(formData.get("order_index")) ?? 1 });
    if (r.error) throw new Error(`Evolution: ${r.error.message}`);
  }
  revalidatePath("/characters"); revalidatePath("/admin/characters");
  redirect("/admin/characters");
}
