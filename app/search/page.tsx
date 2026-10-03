import Link from "next/link";
import { getUserAndProfile } from "@/lib/supabase/server";
import { globalSearch } from "@/lib/queries/characters";

const Group = ({ title, children, n }: { title: string; children: React.ReactNode; n: number }) =>
  n === 0 ? null : <section className="panel p-4"><h2 className="mb-2 font-display font-bold">{title}</h2><ul className="space-y-1 text-sm">{children}</ul></section>;

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const { supabase, user } = await getUserAndProfile();
  if (!q) return <p className="panel p-6 text-mute">Type a name in the search box to find characters, skills, abilities, stages or tags.</p>;
  const r = await globalSearch(supabase, q);
  if (user) await supabase.from("search_history").insert({ user_id: user.id, query: q });
  const total = r.characters.length + r.skills.length + r.abilities.length + r.stages.length + r.tags.length;
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Results for “{q}”</h1>
      {total === 0 && <p className="panel p-6 text-mute">Nothing matches “{q}”. Check the spelling or try a shorter word.</p>}
      <Group title="Characters" n={r.characters.length}>
        {r.characters.map((c: any) => <li key={c.slug}><Link className="hover:text-accent" href={`/characters/${c.slug}`}>{c.display_name} <span className="text-gold">{c.grade}★</span></Link></li>)}
      </Group>
      <Group title="Skills" n={r.skills.length}>
        {r.skills.map((s: any) => <li key={s.slug}><Link className="hover:text-accent" href={`/skills?q=${encodeURIComponent(s.name)}`}>{s.name} <span className="text-mute">{s.skill_type}</span></Link></li>)}
      </Group>
      <Group title="Abilities" n={r.abilities.length}>
        {r.abilities.map((a: any) => <li key={a.id}><Link className="hover:text-accent" href={`/abilities?q=${encodeURIComponent(a.name)}`}>{a.name}</Link></li>)}
      </Group>
      <Group title="Stages" n={r.stages.length}>
        {r.stages.map((s: any) => <li key={s.slug}><Link className="hover:text-accent" href={`/stages?q=${encodeURIComponent(s.name)}`}>{s.name} <span className="text-mute">{s.stage_type}</span></Link></li>)}
      </Group>
      <Group title="Tags" n={r.tags.length}>
        {r.tags.map((t: any) => <li key={t.slug}><Link className="hover:text-accent" href={`/characters?tag=${t.slug}`}>{t.name}</Link></li>)}
      </Group>
    </div>
  );
}
