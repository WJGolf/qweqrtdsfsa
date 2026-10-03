import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { getCharacterBySlug } from "@/lib/queries/characters";
import { fmt } from "@/lib/utils";
import Img from "@/components/ui/Img";
import FavoriteButton from "@/components/characters/FavoriteButton";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="panel p-4"><h2 className="mb-3 font-display text-lg font-bold">{title}</h2>{children}</section>
);
const PERCENT = new Set(["critical_rate", "critical_damage", "evade_rate", "hit_rate", "skill_evade_rate", "skill_hit_rate", "skill_resistance"]);
const Locked = ({ note }: { note?: string | null }) => <span className="badge ml-2 text-mute">{note ? `Locked: ${note}` : "Locked"}</span>;

export default async function CharacterPage({ params }: { params: { slug: string } }) {
  const { supabase, user } = await getUserAndProfile();
  const c = await getCharacterBySlug(supabase, params.slug);
  if (!c) notFound();

  let isFav = false;
  if (user) {
    const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("character_id", c.id).maybeSingle();
    isFav = !!data;
  }
  const sets = [...(c.character_stats ?? [])].sort((a: any, b: any) => a.level - b.level);
  const skills = [...(c.character_skills ?? [])].sort((a: any, b: any) => a.skill_order - b.skill_order);
  const abilities = c.character_abilities ?? [];

  // Group abilities: members are every character linked to the same ability
  const groupIds = abilities.filter((a: any) => a.ability.is_group).map((a: any) => a.ability.id);
  const members: Record<string, any[]> = {};
  if (groupIds.length) {
    const { data } = await supabase.from("character_abilities").select("ability_id, character:characters(display_name,slug,grade)").in("ability_id", groupIds).limit(500);
    (data ?? []).forEach((m: any) => { (members[m.ability_id] ??= []).push(m.character); });
  }

  // Stat values across sets, e.g. "24,110 - 383,490 - 831,762"
  const range = (key: string) => {
    const vals = sets.map((s: any) => s[key]);
    if (vals.every((v: any) => v == null)) return "-";
    const suffix = PERCENT.has(key) ? "%" : "";
    return vals.map((v: any) => `${fmt(v)}${v == null ? "" : suffix}`).join(" - ");
  };
  const rows: { label: string; value: React.ReactNode; sub?: boolean }[] = [
    { label: "[Lab] Extraction Output", value: c.lab_extraction ?? "-" },
    { label: "Leonard Point", value: c.leonard_point != null ? `Max: ${c.leonard_point}` : "-" },
    { label: "Element", value: c.element ? `${c.element.name}${c.element_max ? ` (Max: ${c.element_max})` : ""}` : "-" },
    { label: "Mineral", value: fmt(c.mineral) },
    { label: "Norm. CD", value: c.norm_cd != null ? `${c.norm_cd}s` : "-" },
    { label: "Type", value: c.type ?? "-" },
    { label: "ATK per sec", value: range("atk_per_sec") },
    { label: "ATK", value: range("atk") },
    { label: "Physical ATK", value: range("physical_atk"), sub: true },
    { label: "Magical ATK", value: range("magical_atk"), sub: true },
    { label: "HP", value: range("hp") },
    { label: "DEF", value: range("def") },
    { label: "Physical DEF", value: range("physical_def"), sub: true },
    { label: "Magical DEF", value: range("magical_def"), sub: true },
    { label: "ATK speed", value: c.atk_speed_text ?? range("atk_speed") },
    { label: "Move Speed", value: c.move_speed_text ?? range("move_speed") },
    { label: "Attack Distance", value: range("attack_distance") },
    { label: "Splash Radius", value: range("splash_radius") },
    { label: "Critical Rate", value: range("critical_rate") },
    { label: "Critical Damage", value: range("critical_damage") },
    { label: "Evade Rate", value: range("evade_rate") },
    { label: "Hit Rate", value: range("hit_rate") },
    { label: "Skill Use Rate", value: c.skill_use_text ?? range("skill_use_rate") },
    { label: "Skill Evade Rate", value: range("skill_evade_rate") },
    { label: "Skill Hit Rate", value: range("skill_hit_rate") },
    { label: "Skill Resistance", value: range("skill_resistance") },
  ];

  return (
    <div className="space-y-4">
      <div className="panel flex flex-col gap-4 p-4 md:flex-row">
        <Img bucket="characters" path={c.character_image} alt={c.display_name} className="h-56 w-full rounded-md object-cover md:w-56" />
        <div className="flex-1">
          <p className="text-gold">{c.grade}★</p>
          <h1 className="font-display text-3xl font-bold">{c.display_name}</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
            {[["Type", c.type], ["Element", c.element?.name], ["Role", c.role], ["Rarity", c.rarity ? `${c.rarity}★` : null]].map(([k, v]) => (
              <div key={k as string}><dt className="text-mute">{k}</dt><dd className="font-medium">{(v as string) ?? "-"}</dd></div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap gap-1">
            {(c.character_tags ?? []).map((t: any) => <Link key={t.tag.id} href={`/characters?tag=${t.tag.slug}`} className="badge">{t.tag.name}</Link>)}
          </div>
          {c.description && <p className="mt-3 max-w-prose text-sm text-mute">{c.description}</p>}
          <div className="mt-4">{user ? <FavoriteButton characterId={c.id} isFav={isFav} /> : <Link href="/login" className="btn-ghost">Sign in to favorite</Link>}</div>
        </div>
      </div>

      <Section title="Details">
        {sets.length > 0 && <p className="mb-2 text-xs text-mute">Stat columns: {sets.map((s: any) => s.label).join(" - ")}</p>}
        <dl className="divide-y divide-line/60 text-sm">
          {rows.map((r) => (
            <div key={r.label} className={`flex items-start justify-between gap-4 py-1.5 ${r.sub ? "pl-5 text-xs" : ""}`}>
              <dt className={r.sub ? "text-mute" : "font-medium"}>{r.label}</dt>
              <dd className="text-right">{r.value}</dd>
            </div>
          ))}
          <div className="flex items-start justify-between gap-4 py-1.5">
            <dt className="font-medium">Dropped in Stage</dt>
            <dd className="flex flex-wrap justify-end gap-1">
              {(c.character_stages ?? []).length === 0 ? "-" : c.character_stages.map((cs: any) => (
                <span key={cs.stage.id} className="badge">{cs.stage.stage_type}: {cs.stage.name}{cs.drop_rate != null && ` ${cs.drop_rate}%`}</span>
              ))}
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Skill">
        {skills.length === 0 ? <p className="text-mute">No skills recorded.</p> : (
          <ul className="space-y-4">
            {skills.map((cs: any) => (
              <li key={cs.skill.id} className={`rounded-md bg-raised p-3 ${cs.is_locked ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <Img bucket="skills" path={cs.skill.icon} alt="" className="h-10 w-10 rounded object-cover" />
                  <p className="font-medium">{cs.skill.name}{cs.is_locked && <Locked note={cs.unlock_note} />}</p>
                  <span className="badge">{cs.skill.skill_type}</span>
                  {(cs.skill.probability || cs.skill.cooldown) && (
                    <span className="ml-auto text-xs text-mute">
                      {cs.skill.probability && <>Probability <b className="text-text">{cs.skill.probability}</b></>}
                      {cs.skill.probability && cs.skill.cooldown && " · "}
                      {cs.skill.cooldown && <>CD Time <b className="text-text">{cs.skill.cooldown}</b></>}
                    </span>
                  )}
                </div>
                {(cs.skill.skill_effects ?? []).length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-left text-mute"><tr><th className="px-2 py-1">Effect</th><th className="px-2 py-1">Area</th><th className="px-2 py-1">Factor</th><th className="px-2 py-1">Eff. Dur.</th></tr></thead>
                      <tbody>
                        {[...cs.skill.skill_effects].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((e: any) => (
                          <tr key={e.id} className="border-t border-line/60">
                            <td className="px-2 py-1">{e.effect_type || "-"}</td><td className="px-2 py-1">{e.area ?? "-"}</td>
                            <td className="px-2 py-1">{e.factor ?? "-"}</td><td className="px-2 py-1">{e.duration ?? "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {cs.skill.description && <p className="mt-2 text-sm text-mute">{cs.skill.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Ability">
        {abilities.length === 0 ? <p className="text-mute">No abilities recorded.</p> : (
          <ul className="space-y-4">
            {abilities.map((ca: any) => (
              <li key={ca.ability.id} className={`rounded-md bg-raised p-3 ${ca.is_locked ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <Img bucket="abilities" path={ca.ability.icon} alt="" className="h-10 w-10 rounded object-cover" />
                  <p className="font-medium">{ca.ability.name}{ca.is_locked && <Locked note={ca.unlock_note} />}</p>
                </div>
                {(ca.ability.ability_effects ?? []).length > 0 && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-left text-mute"><tr><th className="px-2 py-1">Effect</th><th className="px-2 py-1">Activate On</th><th className="px-2 py-1">Condition</th><th className="px-2 py-1">Probability</th></tr></thead>
                      <tbody>
                        {ca.ability.ability_effects.map((e: any) => (
                          <tr key={e.id} className="border-t border-line/60">
                            <td className="px-2 py-1">{e.effect ?? "-"}</td><td className="px-2 py-1">{e.activate_on ?? "-"}</td>
                            <td className="px-2 py-1">{e.condition ?? "-"}</td><td className="px-2 py-1">{e.probability != null ? `${e.probability}%` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {ca.ability.group_buff && <p className="mt-2 text-sm"><b>Group Buff</b> <span className="text-mute">{ca.ability.group_buff}</span></p>}
                {ca.ability.is_group && (members[ca.ability.id] ?? []).length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1 text-xs">
                    {members[ca.ability.id].map((m: any) => (
                      <Link key={m.slug} href={`/characters/${m.slug}`} className={`badge ${m.slug === c.slug ? "border-accent text-accent" : ""}`}>{m.grade}★ {m.display_name}</Link>
                    ))}
                  </p>
                )}
                {ca.ability.description && <p className="mt-2 text-sm text-mute">{ca.ability.description}</p>}
                {ca.ability.group_note && <p className="mt-1 text-xs text-mute">{ca.ability.group_note}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {((c.chain && c.chain.members.length > 1) || (c.evolution_materials ?? []).length > 0) && (
        <Section title="Evolution">
          {c.chain && c.chain.members.length > 1 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Evolution chain{c.chain.name && <span className="text-mute"> · {c.chain.name}</span>}</h3>
              <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
                {c.chain.members.map((m: any, i: number) => (
                  <li key={m.character.id} className="flex items-center gap-2">
                    {i > 0 && <span className="text-mute" aria-hidden>→</span>}
                    <Link href={`/characters/${m.character.slug}`}
                      className={`flex items-center gap-2 rounded-md border p-2 hover:bg-raised ${m.character.id === c.id ? "border-accent" : "border-line"}`}>
                      <Img bucket="characters" path={m.character.icon ?? m.character.character_image} alt="" className="h-10 w-10 rounded object-cover" />
                      <span className="text-sm">{m.character.display_name}<span className="block text-xs text-gold">{m.character.grade}★</span></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {(c.evolution_materials ?? []).length > 0 && (
            <div className={c.chain && c.chain.members.length > 1 ? "mt-4 border-t border-line pt-3" : ""}>
              <h3 className="mb-2 text-sm font-medium">Evolution materials</h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {c.evolution_materials.map((m: any) => (
                  <li key={m.item.id} className="flex items-center gap-3 rounded-md bg-raised px-3 py-2 text-sm">
                    <Img bucket="icons" path={m.item.icon} alt="" className="h-9 w-9 rounded object-cover" />
                    <span className="font-medium">{m.item.name}</span><span className="text-gold">×{m.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
