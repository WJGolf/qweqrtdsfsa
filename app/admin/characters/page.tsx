import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteCharacter } from "../actions";

export default async function AdminCharacters() {
  const supabase = createClient();
  const { data } = await supabase.from("characters").select("id,display_name,slug,grade,type,is_active").order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between"><h1 className="font-display text-2xl font-bold">Characters</h1><Link className="btn" href="/admin/characters/new">Add character</Link></div>
      <ul className="panel divide-y divide-line">
        {(data ?? []).length === 0 && <li className="p-4 text-mute">No characters yet. Add the first one.</li>}
        {(data ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span><Link href={`/characters/${c.slug}`} className="font-medium">{c.display_name}</Link> <span className="text-gold">{c.grade}★</span> <span className="text-mute">{c.type}{!c.is_active && " · hidden"}</span></span>
            <span className="flex gap-2">
              <Link className="btn-ghost" href={`/admin/characters/${c.id}`}>Edit</Link>
              <form action={deleteCharacter.bind(null, c.id)}><button className="btn-danger">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
