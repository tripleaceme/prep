import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { VerifyBanner } from "@/components/VerifyBanner";
import { callApi } from "@/lib/api";
import { readSession } from "@/lib/session";
import { assetUrl } from "@/lib/profileActions";

interface ProfileResponse {
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    email: string;
    onboarded: boolean;
    verified: boolean;
  } | null;
}

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await readSession();
  if (!session) redirect("/login");

  let displayName = session.email.split("@")[0];
  let email = session.email;
  let avatar: string | null = null;
  let needsOnboarding = false;
  // Assume verified when go54 is unreachable — nagging someone about an email
  // they may well have confirmed is worse than missing the banner for a load.
  let verified = true;

  try {
    const { profile } = await callApi<ProfileResponse>("profile", {
      userId: session.userId,
    });
    if (profile) {
      displayName = profile.display_name?.trim() || displayName;
      email = profile.email || email;
      avatar = await assetUrl(profile.avatar_url);
      needsOnboarding = !profile.onboarded;
      verified = profile.verified;
    }
  } catch {
    // go54 unreachable — fall back to the email handle rather than blocking
    // the whole app on a profile lookup.
  }

  // Outside the try: redirect() signals by throwing.
  if (needsOnboarding) redirect("/onboarding");

  return (
    <div className="flex">
      <Sidebar displayName={displayName} avatar={avatar} />
      <div className="min-h-dvh flex-1 overflow-x-hidden">
        {verified ? null : <VerifyBanner email={email} />}
        {children}
      </div>
    </div>
  );
}
