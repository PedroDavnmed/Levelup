import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}
