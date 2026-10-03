import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_LINKS } from "@/lib/admin/resources";

export default async function AdminHome() {
  const supabase = createClient();
  const counts = await Promise.all(ADMIN_LINKS.map(async ([k]) => {
    const table = k === "characters" ? "characters" : k;
    const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
    return count ?? 0;
  }));
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {ADMIN_LINKS.map(([k, l], i) => (
          <Link key={k} href={`/admin/${k}`} className="panel p-4 hover:bg-raised"><p className="font-display text-2xl font-bold">{counts[i]}</p><p className="text-sm text-mute">{l}</p></Link>
        ))}
      </div>
    </div>
  );
}
