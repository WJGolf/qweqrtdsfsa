import { createClient } from "@/lib/supabase/server";
import { getFilterOptions, listCharacters, parseParams } from "@/lib/queries/characters";
import Filters from "@/components/filters/Filters";
import CharacterList from "@/components/characters/CharacterList";
import Pagination from "@/components/ui/Pagination";

export default async function CharactersPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const supabase = createClient();
  const p = parseParams(searchParams);
  const [{ rows, total }, options] = await Promise.all([listCharacters(supabase, p), getFilterOptions(supabase)]);
  const flat: Record<string, string | undefined> = {
    q: p.q, grade: p.grade, type: p.type, element: p.element, role: p.role, rarity: p.rarity, tag: p.tag, skill_type: p.skill_type,
    sort: searchParams.sort as string | undefined, dir: searchParams.dir as string | undefined,
  };
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold">Characters</h1>
      <Filters elements={options.elements} tags={options.tags} />
      <CharacterList rows={rows} sort={p.sort} dir={p.dir} params={flat} />
      <Pagination page={p.page} total={total} params={flat} />
    </div>
  );
}
