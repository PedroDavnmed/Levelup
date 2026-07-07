import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";

const LOCAL_MODE = process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export default function LoginPage() {
  // Local mode has no accounts — this page would only collect credentials
  // the app never uses.
  if (LOCAL_MODE) redirect("/dashboard");
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <AuthForm mode="login" />
    </main>
  );
}
