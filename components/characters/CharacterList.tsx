import Link from "next/link";
import type { CharacterRow } from "@/lib/types";
import Img from "@/components/ui/Img";
import { fmt } from "@/lib/utils";

const COLS: [string, string | null][] = [
  ["Grade", "grade"], ["Type", null], ["Element", null], ["Skill", null], ["Ability", null],
  ["ATK", "atk"], ["SPL", null], ["Move Speed", "move_speed"], ["ATK Speed", "atk_speed"], ["Normal CD", null],
  ["M.DPS", "m_dps"], ["M.DEF", "m_def"], ["M.HP", "m_hp"],
];

const IconRow = ({ items, bucket }: { items: { name: string; icon: string | null }[]; bucket: string }) => (
  <div className="flex gap-1">
    {items.length === 0 && <span className="text-mute">-</span>}
    {items.map((i, n) => <Img key={n} bucket={bucket} path={i.icon} alt={i.name} className="h-7 w-7 rounded object-cover" />)}
  </div>
);

export default function CharacterList({ rows, sort, dir, params }: {
  rows: CharacterRow[]; sort: string; dir: string; params: Record<string, string | undefined>;
}) {
  const sortHref = (key: string) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && !["sort", "dir", "page"].includes(k) && sp.set(k, v));
    sp.set("sort", key); sp.set("dir", sort === key && dir === "desc" ? "asc" : "desc");
    return `/characters?${sp.toString()}`;
  };
  if (rows.length === 0) return <p className="panel p-6 text-mute">No characters match these filters. Clear a filter or try another search.</p>;
  return (
    <>
      <div className="panel hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-mute">
            <tr>
              <th className="px-3 py-2"><Link href={sortHref("name")}>Character{sort === "name" ? (dir === "asc" ? " ↑" : " ↓") : ""}</Link></th>
              {COLS.map(([label, key]) => (
                <th key={label} className="whitespace-nowrap px-3 py-2">
                  {key ? <Link href={sortHref(key)}>{label}{sort === key ? (dir === "asc" ? " ↑" : " ↓") : ""}</Link> : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 hover:bg-raised">
                <td className="px-3 py-2">
                  <Link href={`/characters/${r.slug}`} className="flex items-center gap-3 font-medium">
                    <Img bucket="characters" path={r.icon ?? r.character_image} alt="" className="h-10 w-10 rounded object-cover" />
                    {r.display_name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gold">{r.grade}★</td>
                <td className="px-3 py-2">{r.type ?? "-"}</td>
                <td className="px-3 py-2">{r.element_name ?? "-"}</td>
                <td className="px-3 py-2"><IconRow items={r.skills} bucket="skills" /></td>
                <td className="px-3 py-2"><IconRow items={r.abilities} bucket="abilities" /></td>
                <td className="px-3 py-2">{fmt(r.atk)}</td>
                <td className="px-3 py-2">{fmt(r.spl)}</td>
                <td className="px-3 py-2">{fmt(r.move_speed)}</td>
                <td className="px-3 py-2">{fmt(r.atk_speed)}</td>
                <td className="px-3 py-2">{fmt(r.normal_cd)}</td>
                <td className="px-3 py-2">{fmt(r.m_dps)}</td>
                <td className="px-3 py-2">{fmt(r.m_def)}</td>
                <td className="px-3 py-2">{fmt(r.m_hp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="panel p-3">
            <Link href={`/characters/${r.slug}`} className="flex gap-3">
              <Img bucket="characters" path={r.icon ?? r.character_image} alt="" className="h-16 w-16 rounded object-cover" />
              <div className="min-w-0">
                <p className="truncate font-medium">{r.display_name}</p>
                <p className="text-sm text-gold">{r.grade}★ <span className="text-mute">{r.type} · {r.element_name} · {r.role}</span></p>
                <p className="mt-1 text-xs text-mute">ATK {fmt(r.atk)} · HP {fmt(r.hp)} · M.DPS {fmt(r.m_dps)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
