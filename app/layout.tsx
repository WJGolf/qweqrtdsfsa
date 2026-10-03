import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { getUserAndProfile } from "@/lib/supabase/server";
import { signOut } from "./actions";
import SearchBox from "@/components/ui/SearchBox";
import { hasSupabaseEnv } from "@/lib/supabase/env";

const display = Sora({ subsets: ["latin"], variable: "--font-display" });
const body = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-body" });

export const metadata: Metadata = { title: "Game Database", description: "Characters, skills, abilities and stages" };
export const dynamic = "force-dynamic";

const NAV = [["/", "Home"], ["/characters", "Characters"], ["/skills", "Skills"], ["/abilities", "Abilities"], ["/stages", "Stages"], ["/favorites", "Favorites"]];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) {
    return (
      <html lang="th" className={`${display.variable} ${body.variable}`}>
        <body>
          <main className="mx-auto max-w-xl p-6">
            <h1 className="font-display text-2xl font-bold">Game Database is almost ready</h1>
            <p className="mt-3 text-mute">Add these two environment variables in Vercel (Settings → Environment Variables), then redeploy:</p>
            <pre className="panel mt-3 overflow-x-auto p-3 text-sm">NEXT_PUBLIC_SUPABASE_URL{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY</pre>
            <p className="mt-3 text-sm text-mute">Find both in Supabase → Project Settings → API.</p>
          </main>
        </body>
      </html>
    );
  }
  const { user, profile } = await getUserAndProfile();
  const isAdmin = profile?.role === "admin" || profile?.role === "owner";
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="md:flex">
          <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:gap-1 md:border-r md:border-line md:bg-panel md:p-4 md:sticky md:top-0 md:h-screen">
            <Link href="/" className="mb-4 font-display text-lg font-bold">Game DB</Link>
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm text-mute hover:bg-raised hover:text-text">{label}</Link>
            ))}
            {isAdmin && <Link href="/admin" className="rounded-md px-3 py-2 text-sm text-gold hover:bg-raised">Admin</Link>}
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 border-b border-line bg-ink/95 backdrop-blur">
              <div className="flex items-center gap-3 px-4 py-3">
                <Link href="/" className="font-display font-bold md:hidden">Game DB</Link>
                <SearchBox />
                <div className="ml-auto flex items-center gap-2 text-sm">
                  {user ? (
                    <form action={signOut}><button className="btn-ghost" type="submit">Sign out</button></form>
                  ) : (
                    <Link href="/login" className="btn">Sign in</Link>
                  )}
                </div>
              </div>
              <nav className="flex gap-1 overflow-x-auto px-3 pb-2 md:hidden">
                {NAV.map(([href, label]) => (
                  <Link key={href} href={href} className="shrink-0 rounded-md px-3 py-1.5 text-sm text-mute hover:bg-raised">{label}</Link>
                ))}
                {isAdmin && <Link href="/admin" className="shrink-0 rounded-md px-3 py-1.5 text-sm text-gold">Admin</Link>}
              </nav>
            </header>
            <main className="mx-auto max-w-7xl p-4">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
