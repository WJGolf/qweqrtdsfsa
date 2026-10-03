import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/supabase/server";
import { ADMIN_LINKS } from "@/lib/admin/resources";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getUserAndProfile();
  if (!user) redirect("/login");
  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return <p className="panel p-6">This area is for admins. Ask the owner to set your role to admin in the profiles table.</p>;
  }
  return (
    <div>
      <nav className="mb-4 flex gap-1 overflow-x-auto" aria-label="Admin sections">
        <Link href="/admin" className="badge shrink-0">Dashboard</Link>
        {ADMIN_LINKS.map(([k, l]) => <Link key={k} href={`/admin/${k}`} className="badge shrink-0 hover:border-accent">{l}</Link>)}
      </nav>
      {children}
    </div>
  );
}
