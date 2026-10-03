"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(characterId: string, isFav: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (isFav) await supabase.from("favorites").delete().eq("user_id", user.id).eq("character_id", characterId);
  else await supabase.from("favorites").insert({ user_id: user.id, character_id: characterId });
  revalidatePath("/favorites");
  revalidatePath("/characters");
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect("/");
}
