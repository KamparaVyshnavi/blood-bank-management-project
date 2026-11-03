import { SignIn } from "@clerk/nextjs";
import { clerkConfigured } from "@/server/identity";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <h1>Sign in to PulseGrid</h1>
      {clerkConfigured() ? (
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/registry" />
      ) : (
        <p>Authentication is not configured. Follow the setup guide to enable secure role-based access.</p>
      )}
    </>
  );
}
