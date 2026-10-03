import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Img from "@/components/ui/Img";

export default async function AbilitiesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  let q = supabase.from("abilities").select("*, ability_effects(*), character_abilities(character:characters(display_name,slug))").order("name").limit(100);
  if (searchParams.q) q = q.ilike("name", `%${searchParams.q.replace(/[%,()*\\]/g, " ")}%`);
  const { data } = await q;
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Abilities</h1>
      {(data ?? []).length === 0 && <p className="panel p-6 text-mute">No abilities found.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((a: any) => (
          <li key={a.id} className="panel p-3">
            <div className="flex items-center gap-3"><Img bucket="abilities" path={a.icon} alt="" className="h-10 w-10 rounded object-cover" /><p className="font-medium">{a.name}</p></div>
            {a.description && <p className="mt-2 text-sm text-mute">{a.description}</p>}
            {a.ability_effects.map((e: any) => <p key={e.id} className="mt-1 text-xs text-mute">{e.effect} · {e.activate_on} · {e.condition} · {e.probability}%</p>)}
            <p className="mt-2 flex flex-wrap gap-1 text-xs">
              {a.character_abilities.map((ca: any) => <Link key={ca.character.slug} href={`/characters/${ca.character.slug}`} className="badge">{ca.character.display_name}</Link>)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
