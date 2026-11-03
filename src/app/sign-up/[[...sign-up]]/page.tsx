import { SignUp } from "@clerk/nextjs";
import { clerkConfigured } from "@/server/identity";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <h1>Create an Account</h1>
      <p>New accounts require administrative authorization before accessing protected clinical registries.</p>
      {clerkConfigured() ? (
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/registry" />
      ) : (
        <p>Authentication is not configured.</p>
      )}
    </>
  );
}
