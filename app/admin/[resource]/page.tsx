import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RESOURCES } from "@/lib/admin/resources";
import { deleteRow, saveRow } from "../actions";

export default async function ResourcePage({ params, searchParams }: { params: { resource: string }; searchParams: { edit?: string } }) {
  const cfg = RESOURCES[params.resource];
  if (!cfg) notFound();
  const supabase = createClient();
  const refs: Record<string, { id: string; label: string }[]> = {};
  for (const f of cfg.fields) {
    if (f.type === "ref") {
      const { data } = await supabase.from(f.table).select(`id, label:${f.labelCol}`).order(f.labelCol).limit(2000);
      refs[f.key] = (data as any[]) ?? [];
    }
  }
  const { data: rows } = await supabase.from(cfg.table).select("*").order(cfg.orderBy).limit(300);
  const editing: any = searchParams.edit ? (rows ?? []).find((r: any) => r.id === searchParams.edit) ?? (await supabase.from(cfg.table).select("*").eq("id", searchParams.edit).maybeSingle()).data : null;
  const save = saveRow.bind(null, params.resource, editing?.id ?? null);
  const dv = (k: string) => editing?.[k] ?? "";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{cfg.title}</h1>
      <form action={save} key={editing?.id ?? "new"} className="panel grid gap-3 p-4 md:grid-cols-3">
        <h2 className="font-display font-bold md:col-span-3">{editing ? "Edit entry" : "Add entry"}</h2>
        {cfg.fields.map((f) => (
          <label key={f.key} className={`block text-xs text-mute ${f.type === "textarea" ? "md:col-span-3" : ""}`}>
            {f.type === "checkbox" ? null : f.label}
            {f.type === "textarea" ? <textarea className="input mt-1" name={f.key} rows={2} defaultValue={dv(f.key)} />
              : f.type === "select" ? <select className="input mt-1" name={f.key} required={f.required} defaultValue={dv(f.key)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
              : f.type === "ref" ? <select className="input mt-1" name={f.key} required={f.required} defaultValue={dv(f.key)}><option value="">Select…</option>{refs[f.key].map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
              : f.type === "image" ? <span className="block"><input className="input mt-1" type="file" name={f.key} accept="image/*" />{editing?.[f.key] && <span className="mt-1 block text-xs">Current: {editing[f.key]}. Choose a file only to replace it.</span>}</span>
              : f.type === "checkbox" ? <span className="flex items-center gap-2 pt-5 text-sm text-text"><input type="checkbox" name={f.key} defaultChecked={!!editing?.[f.key]} /> {f.label}</span>
              : <input className="input mt-1" name={f.key} type={f.type === "number" ? "number" : "text"} step="any" required={f.required} defaultValue={dv(f.key)} />}
          </label>
        ))}
        <div className="flex gap-2 md:col-span-3">
          <button className="btn">{editing ? "Save changes" : "Add"}</button>
          {editing && <Link className="btn-ghost" href={`/admin/${params.resource}`}>Cancel</Link>}
        </div>
      </form>
      <ul className="panel divide-y divide-line">
        {(rows ?? []).length === 0 && <li className="p-4 text-sm text-mute">Nothing here yet. Use the form above to add the first entry.</li>}
        {(rows ?? []).map((r: any) => (
          <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span className="min-w-0 truncate">{cfg.listCols.map((c) => r[c]).filter((x) => x !== null && x !== undefined).join(" · ")}</span>
            <span className="flex shrink-0 gap-2">
              {params.resource !== "media" && <Link className="btn-ghost" href={`/admin/${params.resource}?edit=${r.id}`}>Edit</Link>}
              <form action={deleteRow.bind(null, params.resource, r.id)}><button className="btn-danger">Delete</button></form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
