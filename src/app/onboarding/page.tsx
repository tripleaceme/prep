import { redirect } from "next/navigation";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = { title: "Set up your practice" };

interface ProfileResponse {
  profile: { onboarded: boolean } | null;
}

export default async function OnboardingPage() {
  const session = await readSession();
  if (!session) redirect("/login");

  // Don't make anyone answer twice. `redirect()` works by throwing, so it must
  // stay outside the try — otherwise the catch below would swallow it.
  let onboarded = false;
  try {
    const { profile } = await callApi<ProfileResponse>("profile", {
      userId: session.userId,
    });
    onboarded = profile?.onboarded ?? false;
  } catch {
    // If go54 is unreachable we'd rather show the wizard than a dead end;
    // saving will surface the real error.
  }

  if (onboarded) redirect("/dashboard");

  return <OnboardingWizard />;
}
