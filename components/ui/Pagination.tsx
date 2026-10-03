import Link from "next/link";
import { PAGE_SIZE } from "@/lib/queries/characters";

export default function Pagination({ page, total, params }: { page: number; total: number; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (n: number) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && sp.set(k, v));
    sp.set("page", String(n));
    return `/characters?${sp.toString()}`;
  };
  return (
    <nav className="mt-4 flex items-center justify-between text-sm text-mute" aria-label="Pagination">
      <span>{total.toLocaleString()} characters</span>
      <div className="flex items-center gap-2">
        {page > 1 ? <Link className="btn-ghost" href={href(page - 1)}>Previous</Link> : <span className="btn-ghost opacity-40">Previous</span>}
        <span>Page {page} of {pages}</span>
        {page < pages ? <Link className="btn-ghost" href={href(page + 1)}>Next</Link> : <span className="btn-ghost opacity-40">Next</span>}
      </div>
    </nav>
  );
}
