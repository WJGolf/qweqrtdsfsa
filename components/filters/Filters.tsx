"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Option } from "@/lib/types";

const range = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));
const SORTS = [["grade", "Grade"], ["name", "Name"], ["atk", "ATK"], ["hp", "HP"], ["def", "DEF"], ["move_speed", "Move Speed"],
  ["atk_speed", "ATK Speed"], ["m_dps", "M.DPS"], ["m_def", "M.DEF"], ["m_hp", "M.HP"]];

export default function Filters({ elements, tags }: { elements: Option[]; tags: Option[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.push(`/characters?${next.toString()}`);
  };
  const Select = ({ k, label, options }: { k: string; label: string; options: [string, string][] }) => (
    <label className="block text-xs text-mute">
      {label}
      <select className="input mt-1" value={sp.get(k) ?? ""} onChange={(e) => set(k, e.target.value)}>
        <option value="">All</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  return (
    <section className="panel mb-4 p-3">
      <button className="btn-ghost md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide filters" : "Filters"}</button>
      <div className={`${open ? "mt-3 grid" : "hidden"} grid-cols-2 gap-3 md:mt-0 md:grid md:grid-cols-4 lg:grid-cols-5`}>
        <label className="col-span-2 block text-xs text-mute md:col-span-4 lg:col-span-5">
          Name
          <input className="input mt-1" defaultValue={sp.get("q") ?? ""} placeholder="Filter by name"
            onKeyDown={(e) => e.key === "Enter" && set("q", (e.target as HTMLInputElement).value)} />
        </label>
        <Select k="grade" label="Grade" options={range(10).map((g) => [g, `${g}★`])} />
        <Select k="type" label="Type" options={[["STR", "STR"], ["INT", "INT"]]} />
        <Select k="element" label="Element" options={elements.map((e) => [e.slug!, e.name])} />
        <Select k="role" label="Role" options={["DPS", "Tank", "Support", "Healer"].map((r) => [r, r])} />
        <Select k="rarity" label="Rarity" options={range(10).map((g) => [g, `${g}★`])} />
        <Select k="tag" label="Tag" options={tags.map((t) => [t.slug!, t.name])} />
        <Select k="skill_type" label="Skill type" options={["Active", "Passive", "Ultimate", "Special"].map((s) => [s, s])} />
        <label className="block text-xs text-mute">
          Sort by
          <select className="input mt-1" value={sp.get("sort") ?? "grade"} onChange={(e) => set("sort", e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <Select k="dir" label="Order" options={[["desc", "High to low"], ["asc", "Low to high"]]} />
        <button className="btn-ghost self-end" onClick={() => router.push("/characters")}>Clear all</button>
      </div>
    </section>
  );
}
