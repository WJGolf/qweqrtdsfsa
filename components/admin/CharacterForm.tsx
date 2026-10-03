import { createClient } from "@/lib/supabase/server";
import { saveCharacter } from "@/app/admin/actions";
import { STAT_FIELDS } from "@/lib/utils/stats";

type Opt = { id: string; name: string };
type Slot = { id: string; locked: boolean; note: string };

const L = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block text-xs text-mute">{label}<div className="mt-1">{children}</div></label>;

const Checks = ({ name, items, checked }: { name: string; items: Opt[]; checked: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.length === 0 && <span className="text-sm text-mute">Nothing to choose yet. Add some first.</span>}
    {items.map((i) => (
      <label key={i.id} className="badge cursor-pointer gap-1"><input type="checkbox" name={name} value={i.id} defaultChecked={checked.includes(i.id)} /> {i.name}</label>
    ))}
  </div>
);

// One row per slot: pick an entry, optionally mark it locked (shown faded) with a note such as "Hyper Evolution".
function SlotRows({ prefix, count, options, values, labelPrefix }: { prefix: string; count: number; options: Opt[]; values: Slot[]; labelPrefix: string }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => {
        const v = values[i];
        return (
          <div key={i} className="grid gap-2 md:grid-cols-[2fr_auto_2fr] md:items-end">
            <L label={`${labelPrefix} ${i + 1}`}>
              <select className="input" name={`${prefix}_${i}`} defaultValue={v?.id ?? ""}>
                <option value="">-</option>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </L>
            <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name={`${prefix}_${i}_locked`} defaultChecked={v?.locked} /> Locked</label>
            <L label="Unlock note"><input className="input" name={`${prefix}_${i}_note`} defaultValue={v?.note ?? ""} placeholder="e.g. Hyper Evolution" /></L>
          </div>
        );
      })}
    </div>
  );
}

export default async function CharacterForm({ id }: { id?: string }) {
  const supabase = createClient();
  const [el, cat, sk, ab, tg, stg, ch, it] = await Promise.all(
    [["elements", "name"], ["categories", "name"], ["skills", "name"], ["abilities", "name"], ["tags", "name"], ["stages", "name"], ["evolution_chains", "name"], ["items", "name"]]
      .map(([t, c]) => supabase.from(t).select(`id, name:${c}`).order(c).limit(2000)));
  const list = (r: { data: unknown }) => (r.data as Opt[] | null) ?? [];

  let c: any = null, sets: any[] = [], skillSlots: Slot[] = [], abilitySlots: Slot[] = [], mats: { item_id: string; quantity: number }[] = [];
  let sel = { tags: [] as string[], stages: [] as string[] }, chain: any = { chain_id: "", order_index: "" };
  if (id) {
    const { data } = await supabase.from("characters").select(`*, character_stats(*), character_skills(skill_id,skill_order,is_locked,unlock_note),
      character_abilities(ability_id,is_locked,unlock_note), character_tags(tag_id), character_stages(stage_id),
      evolution_chain_members(chain_id,order_index), evolution_materials(item_id,quantity)`).eq("id", id).single();
    c = data;
    if (c) {
      sets = [...(c.character_stats ?? [])].sort((a: any, b: any) => a.level - b.level);
      skillSlots = [...c.character_skills].sort((a: any, b: any) => a.skill_order - b.skill_order).map((x: any) => ({ id: x.skill_id, locked: x.is_locked, note: x.unlock_note ?? "" }));
      abilitySlots = c.character_abilities.map((x: any) => ({ id: x.ability_id, locked: x.is_locked, note: x.unlock_note ?? "" }));
      mats = c.evolution_materials ?? [];
      sel = { tags: c.character_tags.map((x: any) => x.tag_id), stages: c.character_stages.map((x: any) => x.stage_id) };
      chain = c.evolution_chain_members?.[0] ?? chain;
    }
  }
  const v = (k: string) => c?.[k] ?? "";
  const defaults = ["Lv.1", "Lv.Max", "Awakened"];
  return (
    <form action={saveCharacter} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}

      <section className="panel grid gap-3 p-4 md:grid-cols-3">
        <h2 className="font-display font-bold md:col-span-3">Basic info</h2>
        <L label="Character image"><input className="input" type="file" name="character_image" accept="image/*" /></L>
        <L label="Icon"><input className="input" type="file" name="icon" accept="image/*" /></L>
        <L label="Release date"><input className="input" type="date" name="release_date" defaultValue={v("release_date")} /></L>
        <L label="Name (internal)"><input className="input" name="name" defaultValue={v("name")} placeholder="kaiju_no_8_kafka" /></L>
        <L label="Display name"><input className="input" name="display_name" required defaultValue={v("display_name")} /></L>
        <L label="Slug"><input className="input" name="slug" defaultValue={v("slug")} placeholder="auto from display name" /></L>
        <L label="Grade"><input className="input" type="number" name="grade" min={1} defaultValue={v("grade") || 1} /></L>
        <L label="Type"><select className="input" name="type" defaultValue={v("type")}><option value="">-</option><option>STR</option><option>INT</option></select></L>
        <L label="Element"><select className="input" name="element_id" defaultValue={v("element_id")}><option value="">-</option>{list(el).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
        <L label="Role"><select className="input" name="role" defaultValue={v("role")}><option value="">-</option>{["DPS", "Tank", "Support", "Healer"].map((r) => <option key={r}>{r}</option>)}</select></L>
        <L label="Rarity"><input className="input" type="number" name="rarity" min={1} defaultValue={v("rarity") || 1} /></L>
        <L label="Category"><select className="input" name="category_id" defaultValue={v("category_id")}><option value="">-</option>{list(cat).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
        <div className="md:col-span-3"><L label="Description"><textarea className="input" rows={3} name="description" defaultValue={v("description")} /></L></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={c ? c.is_active : true} /> Visible on the site</label>
      </section>

      <section className="panel grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
        <h2 className="col-span-2 font-display font-bold md:col-span-4">Details</h2>
        <L label="[Lab] Extraction output"><input className="input" name="lab_extraction" defaultValue={v("lab_extraction")} placeholder="5400 / 600 / 90" /></L>
        <L label="Leonard Point (max)"><input className="input" type="number" name="leonard_point" defaultValue={v("leonard_point")} /></L>
        <L label="Element max"><input className="input" type="number" name="element_max" defaultValue={v("element_max")} /></L>
        <L label="Mineral"><input className="input" type="number" name="mineral" defaultValue={v("mineral")} /></L>
        <L label="Norm. CD (seconds)"><input className="input" type="number" step="any" name="norm_cd" defaultValue={v("norm_cd")} /></L>
        <L label="ATK speed text"><input className="input" name="atk_speed_text" defaultValue={v("atk_speed_text")} placeholder="Fast (2.17s + 0.00s)" /></L>
        <L label="Move speed text"><input className="input" name="move_speed_text" defaultValue={v("move_speed_text")} placeholder="Fast (118pt/s)" /></L>
        <L label="Skill use rate text"><input className="input" name="skill_use_text" defaultValue={v("skill_use_text")} placeholder="See Below" /></L>
        <L label="Max level"><input className="input" type="number" name="max_level" defaultValue={sets[0]?.max_level ?? ""} /></L>
      </section>

      <section className="panel p-4">
        <h2 className="mb-1 font-display font-bold">Stats</h2>
        <p className="mb-3 text-xs text-mute">Up to 3 sets (for example Lv.1, Lv.Max, Awakened). The detail page shows them as a range like 24,110 - 383,490 - 831,762. Leave a set's label empty to skip it.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-40 px-2 py-1 text-left text-xs text-mute">Label / level</th>
                {[0, 1, 2].map((i) => (
                  <th key={i} className="px-2 py-1">
                    <div className="flex gap-1">
                      <input className="input" name={`set_${i}_label`} defaultValue={sets[i]?.label ?? (id ? "" : defaults[i])} aria-label={`Set ${i + 1} label`} />
                      <input className="input w-20" type="number" name={`set_${i}_level`} defaultValue={sets[i]?.level ?? ""} placeholder="Lv" aria-label={`Set ${i + 1} level`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAT_FIELDS.map(([k, label]) => (
                <tr key={k} className="border-t border-line/60">
                  <td className="px-2 py-1 text-xs text-mute">{label}</td>
                  {[0, 1, 2].map((i) => (
                    <td key={i} className="px-2 py-1"><input className="input" type="number" step="any" name={`stat_${i}_${k}`} defaultValue={sets[i]?.[k] ?? ""} aria-label={`${label} set ${i + 1}`} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel space-y-3 p-4">
        <h2 className="font-display font-bold">Skills</h2>
        <p className="text-xs text-mute">Most characters have 2 skills. Use a third slot for an upgraded version and mark it Locked. Create skills first under Admin → Skills.</p>
        <SlotRows prefix="skill" count={4} options={list(sk)} values={skillSlots} labelPrefix="Skill" />
      </section>

      <section className="panel space-y-3 p-4">
        <h2 className="font-display font-bold">Abilities</h2>
        <SlotRows prefix="ability" count={3} options={list(ab)} values={abilitySlots} labelPrefix="Ability" />
      </section>

      <section className="panel space-y-4 p-4">
        <div><h2 className="mb-2 font-display font-bold">Tags</h2><Checks name="tags" items={list(tg)} checked={sel.tags} /></div>
        <div><h2 className="mb-2 font-display font-bold">Dropped in stage</h2><Checks name="stages" items={list(stg)} checked={sel.stages} /></div>
        <div className="grid gap-3 md:grid-cols-2">
          <L label="Evolution chain"><select className="input" name="chain_id" defaultValue={chain.chain_id}><option value="">None</option>{list(ch).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></L>
          <L label="Position in chain (1 = first form)"><input className="input" type="number" name="order_index" min={1} defaultValue={chain.order_index} /></L>
        </div>
        <div>
          <h2 className="mb-2 font-display font-bold">Evolution materials</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <select className="input" name={`mat_${i}_item`} defaultValue={mats[i]?.item_id ?? ""} aria-label={`Material ${i + 1}`}><option value="">-</option>{list(it).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
                <input className="input w-24" type="number" min={1} name={`mat_${i}_qty`} defaultValue={mats[i]?.quantity ?? ""} placeholder="Qty" aria-label={`Material ${i + 1} quantity`} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <button className="btn">Save character</button>
    </form>
  );
}
