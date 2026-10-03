import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Img from "@/components/ui/Img";

export default async function Home() {
  const supabase = createClient();
  const count = (t: string) => supabase.from(t).select("*", { count: "exact", head: true });
  const [ch, sk, ab, st, latest] = await Promise.all([
    count("characters"), count("skills"), count("abilities"), count("stages"),
    supabase.from("characters").select("display_name,slug,grade,type,character_image,icon").eq("is_active", true)
      .order("created_at", { ascending: false }).limit(8),
  ]);
  const stats: [string, number | null, string][] = [
    ["Characters", ch.count, "/characters"], ["Skills", sk.count, "/skills"],
    ["Abilities", ab.count, "/abilities"], ["Stages", st.count, "/stages"],
  ];
  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-3xl font-bold">Game Database</h1>
        <p className="mt-2 max-w-prose text-mute">Look up any character's stats, skills, abilities, evolution line and drop stages.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([label, n, href]) => (
            <Link key={label} href={href} className="panel p-4 hover:bg-raised">
              <p className="font-display text-2xl font-bold">{(n ?? 0).toLocaleString()}</p>
              <p className="text-sm text-mute">{label}</p>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Recently added</h2>
        {(latest.data ?? []).length === 0 ? (
          <p className="panel p-6 text-mute">No characters yet. Run the seed file or add one in the admin panel.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {latest.data!.map((c) => (
              <li key={c.slug}>
                <Link href={`/characters/${c.slug}`} className="panel flex items-center gap-3 p-3 hover:bg-raised">
                  <Img bucket="characters" path={c.icon ?? c.character_image} alt="" className="h-12 w-12 rounded object-cover" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{c.display_name}</p><p className="text-xs text-gold">{c.grade}★ <span className="text-mute">{c.type}</span></p></div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
