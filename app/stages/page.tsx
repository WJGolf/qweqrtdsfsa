import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StagesPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();
  let q = supabase.from("stages").select("*, stage_rewards(*), character_stages(drop_rate, character:characters(display_name,slug))").order("stage_type").order("name").limit(100);
  if (searchParams.q) q = q.ilike("name", `%${searchParams.q.replace(/[%,()*\\]/g, " ")}%`);
  const { data } = await q;
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Stages</h1>
      {(data ?? []).length === 0 && <p className="panel p-6 text-mute">No stages found.</p>}
      <ul className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((s: any) => (
          <li key={s.id} className="panel p-3">
            <p className="font-medium">{s.name} <span className="badge ml-1">{s.stage_type}</span></p>
            {s.description && <p className="mt-1 text-sm text-mute">{s.description}</p>}
            {s.stage_rewards.length > 0 && <p className="mt-2 text-xs text-mute">Rewards: {s.stage_rewards.map((r: any) => `${r.reward_name} ×${r.quantity ?? 1} (${r.drop_rate ?? 100}%)`).join(", ")}</p>}
            <p className="mt-2 flex flex-wrap gap-1 text-xs">
              {s.character_stages.map((cs: any) => <Link key={cs.character.slug} href={`/characters/${cs.character.slug}`} className="badge">{cs.character.display_name} {cs.drop_rate != null && `${cs.drop_rate}%`}</Link>)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
