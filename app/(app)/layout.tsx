import { redirect } from "next/navigation";
import { StoreProvider } from "@/lib/store";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppShell from "@/components/AppShell";

const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cloud mode: require a signed-in user. Local mode skips auth entirely.
  if (!LOCAL_MODE) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return (
    <ThemeProvider>
      <StoreProvider>
        <AppShell>{children}</AppShell>
      </StoreProvider>
    </ThemeProvider>
  );
}
