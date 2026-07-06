import Link from "next/link";
import { redirect } from "next/navigation";

const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export default async function Landing() {
  if (!LOCAL_MODE) {
    // Cloud mode: send signed-in users straight to the dashboard.
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-400">
          ⚡ Level up your real life
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Turn training, study &amp; habits into a game.
        </h1>
        <p className="mt-4 text-lg text-muted">
          Log what you do, earn XP, build streaks, and watch your stats climb.
          LevelUp keeps you motivated and aware of your real progress.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary px-6 py-3 text-base">
            Enter app →
          </Link>
          {!LOCAL_MODE && (
            <Link href="/login" className="btn-ghost px-6 py-3 text-base">
              I have an account
            </Link>
          )}
        </div>
        {LOCAL_MODE && (
          <p className="mt-6 text-xs text-muted">
            Running in local mode — your data is saved in this browser. No account
            needed.
          </p>
        )}
      </div>
    </main>
  );
}
