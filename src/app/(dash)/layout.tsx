import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";

interface ProfileResponse {
  profile: { display_name: string | null; onboarded: boolean } | null;
}

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  let displayName = session.email.split("@")[0];
  let needsOnboarding = false;

  try {
    const { profile } = await callApi<ProfileResponse>("profile", {
      userId: session.userId,
    });
    if (profile) {
      displayName = profile.display_name?.trim() || displayName;
      needsOnboarding = !profile.onboarded;
    }
  } catch {
    // go54 unreachable — fall back to the email handle rather than blocking
    // the whole app on a profile lookup.
  }

  // Outside the try: redirect() signals by throwing.
  if (needsOnboarding) redirect("/onboarding");

  return (
    <div className="flex">
      <Sidebar displayName={displayName} />
      <div className="min-h-dvh flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
