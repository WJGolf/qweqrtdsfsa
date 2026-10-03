import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import Img from "@/components/ui/Img";

export default async function FavoritesPage() {
  const { supabase, user } = await getUserAndProfile();
  if (!user) redirect("/login");
  const { data } = await supabase.from("favorites")
    .select("created_at, character:characters(id,display_name,slug,grade,type,character_image,icon)")
    .eq("user_id", user.id).order("created_at", { ascending: false });
  const rows = (data ?? []) as any[];
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Favorites</h1>
      {rows.length === 0 ? (
        <p className="panel p-6 text-mute">No favorites yet. Open a character and select Favorite to save it here.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.character.id}>
              <Link href={`/characters/${r.character.slug}`} className="panel flex items-center gap-3 p-3 hover:bg-raised">
                <Img bucket="characters" path={r.character.icon ?? r.character.character_image} alt="" className="h-14 w-14 rounded object-cover" />
                <div><p className="font-medium">{r.character.display_name}</p><p className="text-sm text-gold">{r.character.grade}★ <span className="text-mute">{r.character.type}</span></p></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
