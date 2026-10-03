import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Img from "@/components/ui/Img";

export default async function SkillsPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  let q = supabase.from("skills").select("*, skill_effects(effect_type), character_skills(character:characters(display_name,slug))").order("name").limit(100);
  if (searchParams.q) q = q.ilike("name", `%${searchParams.q.replace(/[%,()*\\]/g, " ")}%`);
  const { data } = await q;
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Skills</h1>
      {(data ?? []).length === 0 && <p className="panel p-6 text-mute">No skills found.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((s: any) => (
          <li key={s.id} className="panel p-3">
            <div className="flex items-center gap-3">
              <Img bucket="skills" path={s.icon} alt="" className="h-10 w-10 rounded object-cover" />
              <div><p className="font-medium">{s.name}</p><span className="badge">{s.skill_type}</span></div>
            </div>
            {s.description && <p className="mt-2 text-sm text-mute">{s.description}</p>}
            <p className="mt-2 flex flex-wrap gap-1 text-xs">
              {s.character_skills.map((cs: any) => <Link key={cs.character.slug} href={`/characters/${cs.character.slug}`} className="badge">{cs.character.display_name}</Link>)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
